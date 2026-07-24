import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { DisclaimerAcceptance } from '../models/disclaimer-acceptance.entity';
import { EnrollmentToken } from '../models/enrollment-token.entity';
import { Organization } from '../models/organization.entity';
import { OrganizationPerson } from '../models/organization-person.entity';
import { Person } from '../models/person.entity';
import { AuthAuditLogRepository } from '../repositories/auth-audit-log.repository';
import { AuthAuditEvent } from '../models/auth-audit-log.entity';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';

const ENROLLMENT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Static free-mail blocklist; the funder's corporateEmailMode decides
 * whether a hit BLOCKs registration or is FLAG_ONLY (accepted + flagged). */
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com',
  'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
  'gmx.com', 'gmx.net', 'mail.com', 'zoho.com', 'qq.com', '163.com',
  '126.com', 'yandex.com', 'yandex.ru',
]);

export interface RegisterInput {
  email: string;
  contactName: string;
  companyName: string;
  businessRegistrationNumber?: string;
  country: string;
  disclaimerCode: string;
  disclaimerHash: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

interface OnboardingConfig {
  funderOrganizationId: number;
  disclaimer: { documentCode: string; body: string; hash: string };
  corporateEmailMode: 'BLOCK' | 'FLAG_ONLY';
  bankCountryMatchMode: string;
  activeProducts: { productCode: string; productName: string }[];
}

/**
 * Customer Portal self-registration (pass 1). Public + throttled; the only
 * unauthenticated write path in trade-directory besides the auth flows.
 * Policy modes come from the product-configurator's public onboarding
 * config, cached 60s and FAIL CLOSED (no config -> no registrations) —
 * same pragmatic sync-read pattern as the RBAC manifest guard.
 */
@Injectable()
export class PortalOnboardingService {
  private readonly logger = new Logger(PortalOnboardingService.name);
  private configCache: { value: OnboardingConfig; fetchedAt: number } | null = null;

  constructor(
    @InjectRepository(DisclaimerAcceptance)
    private readonly disclaimerAcceptanceRepository: Repository<DisclaimerAcceptance>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly authAuditLogRepository: AuthAuditLogRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly entityManager: EntityManager,
    private readonly configService: ConfigService,
  ) {}

  async fetchOnboardingConfig(): Promise<OnboardingConfig> {
    if (this.configCache && Date.now() - this.configCache.fetchedAt < 60_000) {
      return this.configCache.value;
    }
    const url = this.configService.getOrThrow<string>('ONBOARDING_CONFIG_URL');
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const value = (await res.json()) as OnboardingConfig;
      this.configCache = { value, fetchedAt: Date.now() };
      return value;
    } catch (error) {
      this.logger.error(`Onboarding config fetch failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException(
        'Onboarding is temporarily unavailable — please try again shortly',
      );
    }
  }

  async register(
    input: RegisterInput,
    meta: { ipAddress: string | null; userAgent: string | null },
  ) {
    if (!input.acceptedTerms || !input.acceptedPrivacy) {
      throw new BadRequestException(
        'Both the Terms & Credit Check Authorisation and the Data Privacy Consent must be accepted',
      );
    }
    const config = await this.fetchOnboardingConfig();
    if (
      input.disclaimerCode !== config.disclaimer.documentCode ||
      input.disclaimerHash !== config.disclaimer.hash
    ) {
      // The disclaimer text changed between render and submit — the
      // acceptance record must reference the exact text that was seen.
      throw new ConflictException(
        'The legal disclaimer has been updated — please review and accept the current version',
      );
    }

    const email = input.email.trim().toLowerCase();
    const domain = email.split('@')[1] ?? '';
    if (!domain || !email.includes('@')) {
      throw new BadRequestException('A valid company email address is required');
    }
    const isFreeMail = FREE_MAIL_DOMAINS.has(domain);
    if (isFreeMail && config.corporateEmailMode === 'BLOCK') {
      throw new BadRequestException(
        'A corporate email address is required — personal email providers (gmail, yahoo, …) are not accepted',
      );
    }

    const existingPerson = await this.personRepository.findOne({ where: { email } });
    if (existingPerson) {
      throw new ConflictException(
        'An account with this email already exists — sign in instead',
      );
    }

    // Organization dedup mirrors the invoice auto-create flow: prefer the
    // business registration number, else exact name match.
    const registrationNumber = input.businessRegistrationNumber?.trim() || null;
    let existingOrg: Organization | null = null;
    if (registrationNumber) {
      existingOrg = await this.organizationRepository.findOne({
        where: { businessRegistrationNumber: registrationNumber },
        relations: ['organizationPersons'],
      });
    }
    if (!existingOrg) {
      existingOrg = await this.organizationRepository.findOne({
        where: { organizationName: input.companyName.trim() },
        relations: ['organizationPersons'],
      });
    }
    if (existingOrg && (existingOrg.organizationPersons ?? []).length > 0) {
      throw new ConflictException(
        'This company is already registered on the platform — contact your administrator or the funder for access',
      );
    }

    const rawToken = randomBytes(48).toString('base64url');
    const portalBase = this.configService.getOrThrow<string>('CUSTOMER_PORTAL_URL');
    const enrollmentUrl = `${portalBase}/enroll#token=${rawToken}`;
    const expiresAt = new Date(Date.now() + ENROLLMENT_TOKEN_TTL_MS);

    const result = await this.entityManager.transaction(async (manager) => {
      // Adopt a member-less auto-created org (invoice flow) or create fresh
      const organization =
        existingOrg ??
        (await manager.save(
          Organization,
          manager.create(Organization, {
            organizationName: input.companyName.trim(),
            country: input.country.trim().toUpperCase(),
            businessRegistrationNumber: registrationNumber,
          } as Partial<Organization>),
        ));

      const person = await manager.save(
        Person,
        manager.create(Person, { name: input.contactName.trim(), email }),
      );
      await manager.save(
        OrganizationPerson,
        manager.create(OrganizationPerson, {
          person: { id: person.id } as never,
          organization: { id: organization.id } as never,
          designation: 'Applicant Contact',
        }),
      );
      await manager.save(
        DisclaimerAcceptance,
        manager.create(DisclaimerAcceptance, {
          email,
          personId: person.id,
          disclaimerCode: input.disclaimerCode,
          disclaimerHash: input.disclaimerHash,
          acceptedTerms: true,
          acceptedPrivacy: true,
          corporateEmailFlagged: isFreeMail,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      );
      await manager.save(
        EnrollmentToken,
        new EnrollmentToken({
          person,
          tokenHash: createHash('sha256').update(rawToken).digest('hex'),
          expiresAt,
          usedAt: null,
          createdByPersonId: person.id,
        }),
      );
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.SEND_EMAIL,
        payload: {
          eventId: uuid(),
          emailSender: 'notification@sqf.ai',
          emailReceivers: [email],
          emailCc: [],
          emailBcc: [],
          emailReplyTo: [],
          emailSubject: 'SQF — Complete your financing application account setup',
          emailBody:
            `Hello ${input.contactName.trim()},\n\n` +
            `Thank you for starting a financing application for ${input.companyName.trim()}.\n\n` +
            `Set up your passkey to access the application workspace (link valid for 24 hours, single use):\n` +
            `${enrollmentUrl}\n\n` +
            `If you did not request this, you can ignore this email.`,
        } as Record<string, unknown>,
      });
      return { organizationId: organization.id, personId: person.id };
    });

    await this.authAuditLogRepository.record({
      event: AuthAuditEvent.ENROLLMENT_TOKEN_ISSUED,
      email,
      outcome: 'SUCCESS',
      personId: result.personId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      detail: 'portal self-registration',
    });
    // Dev convenience only — the raw link is never returned in the response
    this.logger.log(`Portal enrollment link for ${email}: ${enrollmentUrl}`);

    return { ok: true };
  }
}
