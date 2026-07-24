import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { RiskFilter1StatusEnum } from '@app/common/apps/risk-operation/enums/risk-filter-1-status.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Application } from '../../models/application.entity';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskAuditEvent, RiskAuditLog } from '../../models/risk-governance.entity';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { RiskQuantitativeProfileScoringService } from '../risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.service';

/** SLA template code for the RM's 10-working-day fail-engagement window. */
export const RM_ENGAGEMENT_SLA_CODE = 'RM_APPLICANT_ENGAGEMENT';

/** Required KYC document classes per product (approved annotation Q4:
 * static in code for v1 — domain logic, not funder preference). */
export const REQUIRED_DOCUMENT_CLASSES: Record<string, string[]> = {
  AR: ['COMPANY_REGISTRY', 'FINANCIAL_STATEMENTS', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS'],
  IF: ['COMPANY_REGISTRY', 'FINANCIAL_STATEMENTS', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS'],
  SCF: ['COMPANY_REGISTRY', 'FINANCIAL_STATEMENTS', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS'],
  TL: ['COMPANY_REGISTRY', 'FINANCIAL_STATEMENTS', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS'],
};

/** Countries that do not use IBAN — SWIFT alone carries the country check. */
const NON_IBAN_COUNTRIES = new Set(['US', 'NZ', 'AU', 'CA', 'SG', 'MY', 'HK', 'CN', 'JP', 'IN', 'TH', 'ID', 'PH', 'VN', 'KR', 'TW', 'ZA']);

interface OnboardingConfig {
  funderOrganizationId: number;
  corporateEmailMode: string;
  bankCountryMatchMode: 'HARD_BLOCK' | 'FLAG_ONLY';
  activeProducts: { productCode: string; productName: string }[];
}

interface CallerContext {
  personId: number;
  orgId: number;
}

/**
 * Customer Portal pass 1 — web-intake application lifecycle:
 * DRAFT -> SUBMITTED -> SCORED_PASS | SCORED_FAIL -> IN_CRC_REVIEW /
 * CLOSED_ARCHIVED. Adopts the existing application table (it anchors the
 * Filter-1 chain). Scoring runs on submit when the financial credit report
 * has already flowed through document-management; otherwise a cron retries
 * until the report lands.
 */
@Injectable()
export class PortalApplicationService {
  private readonly logger = new Logger(PortalApplicationService.name);
  private configCache: { value: OnboardingConfig; fetchedAt: number } | null = null;

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(RiskProfile)
    private readonly riskProfileRepository: Repository<RiskProfile>,
    private readonly scoringService: RiskQuantitativeProfileScoringService,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  // ------------------------------------------------------------------
  // Client-facing (PortalJwtGuard, own-org rows only)
  // ------------------------------------------------------------------

  async getOrCreateDraft(ctx: CallerContext) {
    const existing = await this.findCurrent(ctx.orgId);
    if (existing) return this.toClientView(existing);

    const config = await this.fetchOnboardingConfig();
    const application = await this.applicationRepository.save(
      new Application({
        organizationId: ctx.orgId,
        funderOrganizationId: config.funderOrganizationId,
        clientOrganizationName: '',
        applicationStatus: ApplicationStatusEnum.DRAFT,
        applicationNumber: `WEB_${Date.now()}_${ctx.orgId}`,
        applicationDate: new Date(),
        applicationPayload: {},
      } as Partial<Application> as Application),
    );
    return this.toClientView(application);
  }

  async saveDraft(ctx: CallerContext, input: { productCode?: string; payload?: Record<string, any> }) {
    const application = await this.requireCurrent(ctx.orgId);
    if (application.applicationStatus !== ApplicationStatusEnum.DRAFT) {
      throw new BadRequestException('The application has been submitted and can no longer be edited');
    }
    if (input.productCode !== undefined) {
      const config = await this.fetchOnboardingConfig();
      if (!config.activeProducts.some((p) => p.productCode === input.productCode)) {
        throw new BadRequestException(`Unknown or inactive product "${input.productCode}"`);
      }
      application.productCode = input.productCode;
    }
    if (input.payload !== undefined) {
      application.applicationPayload = {
        ...(application.applicationPayload ?? {}),
        ...input.payload,
      };
      const companyName = application.applicationPayload?.companyProfile?.companyName;
      if (typeof companyName === 'string' && companyName.trim()) {
        application.clientOrganizationName = companyName.trim();
      }
    }
    await this.applicationRepository.save(application);
    return this.toClientView(application);
  }

  async submit(ctx: CallerContext) {
    const application = await this.requireCurrent(ctx.orgId);
    if (application.applicationStatus !== ApplicationStatusEnum.DRAFT) {
      throw new BadRequestException('This application has already been submitted');
    }
    const config = await this.fetchOnboardingConfig();
    const payload = application.applicationPayload ?? {};
    const errors: string[] = [];
    const flags: Record<string, any> = {};

    // Product + company profile
    if (!application.productCode) errors.push('Select a product before submitting');
    const profile = payload.companyProfile ?? {};
    for (const [field, label] of [
      ['companyName', 'company name'],
      ['businessRegistrationNumber', 'business registration number'],
      ['country', 'registered country'],
    ] as const) {
      if (!String(profile[field] ?? '').trim()) errors.push(`Company profile: ${label} is required`);
    }
    const form = payload.applicationForm ?? {};
    if (Object.keys(form).length === 0) errors.push('The application form has not been completed');

    // Required KYC documents (uuids recorded per class at upload time)
    const documents: Record<string, { uuid: string; fileName: string }[]> = payload.documents ?? {};
    for (const cls of REQUIRED_DOCUMENT_CLASSES[application.productCode ?? ''] ?? []) {
      if (!(documents[cls]?.length > 0)) {
        errors.push(`Required document missing: ${cls.replace(/_/g, ' ').toLowerCase()}`);
      }
    }

    // Settlement bank account + country-match policy (IBAN pos 1-2 /
    // SWIFT pos 5-6 vs the registered company country)
    const bank = payload.bankAccount ?? {};
    const clientCountry = String(profile.country ?? '').toUpperCase();
    if (!String(bank.beneficiaryName ?? '').trim() || !String(bank.swift ?? '').trim()) {
      errors.push('Settlement bank account: beneficiary name and SWIFT/BIC are required');
    } else {
      const swift = String(bank.swift).replace(/\s+/g, '').toUpperCase();
      const iban = String(bank.iban ?? '').replace(/\s+/g, '').toUpperCase();
      const swiftCountry = swift.length >= 6 ? swift.substring(4, 6) : '';
      const mismatches: string[] = [];
      if (swiftCountry && swiftCountry !== clientCountry) {
        mismatches.push(`SWIFT code points to ${swiftCountry}`);
      }
      if (!NON_IBAN_COUNTRIES.has(clientCountry)) {
        if (!iban) {
          errors.push('Settlement bank account: IBAN is required for your registered country');
        } else if (iban.substring(0, 2) !== clientCountry) {
          mismatches.push(`IBAN points to ${iban.substring(0, 2)}`);
        }
      } else if (iban && iban.substring(0, 2) !== clientCountry) {
        mismatches.push(`IBAN points to ${iban.substring(0, 2)}`);
      }
      if (mismatches.length) {
        if (config.bankCountryMatchMode === 'HARD_BLOCK') {
          errors.push(
            `Bank country mismatch: ${mismatches.join('; ')} — your bank account must be located in your registered business country (${clientCountry})`,
          );
        } else {
          flags.bankCountryMismatch = mismatches;
        }
      }
    }

    // Director eResolution + mock eKYC (pass 1): >= 2 directors need the
    // signed resolution; a sole director skips it but still uploads a
    // passport. Names must match the company-profile director list —
    // mismatches are FLAGGED to the CO, not blocking (blueprint: red
    // traffic light on the dashboard).
    const directors: { name?: string; passportDocUuid?: string }[] = payload.directors ?? [];
    if (!directors.length) {
      errors.push('At least one company director is required');
    } else {
      if (directors.length >= 2 && !payload.eResolutionDocUuid) {
        errors.push('A signed company resolution (eResolution) is required when there are 2 or more directors');
      }
      const missingPassports = directors.filter((d) => !d.passportDocUuid);
      if (missingPassports.length) {
        errors.push('Every director must upload a passport for identity verification');
      }
      const profileDirectors: string[] = (profile.directors ?? []).map((d: any) =>
        String(typeof d === 'string' ? d : d?.name ?? '').trim().toLowerCase(),
      );
      const mismatched = directors
        .map((d) => String(d.name ?? '').trim())
        .filter((name) => name && !profileDirectors.includes(name.toLowerCase()));
      if (mismatched.length) {
        flags.directorNameMismatches = mismatched;
      }
      flags.ekycProvider = 'MOCK';
      flags.ekycLiveness = 'PASSED_MOCK';
    }

    if (errors.length) {
      throw new BadRequestException({ message: 'Application incomplete', errors });
    }

    await this.dataSource.transaction(async (manager) => {
      application.applicationStatus = ApplicationStatusEnum.SUBMITTED;
      application.submittedAt = new Date();
      application.complianceFlags = flags;
      await manager.save(Application, application);
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.SEND_EMAIL,
        payload: {
          eventId: uuid(),
          emailSender: 'notification@sqf.ai',
          emailReceivers: [String(profile.contactEmail ?? payload.contactEmail ?? '')].filter(Boolean),
          emailCc: [],
          emailBcc: [],
          emailReplyTo: [],
          emailSubject: 'SQF — Your financing application has been received',
          emailBody:
            `Your financing application for ${application.clientOrganizationName} ` +
            `(${application.applicationNumber}) has been received and is being processed. ` +
            `You can follow its status in the portal.`,
        } as Record<string, unknown>,
      });
    });

    // Score immediately when the financial report has already been
    // extracted; otherwise the cron below picks it up.
    await this.tryScore(application.id);
    const fresh = await this.applicationRepository.findOne({ where: { id: application.id } });
    return this.toClientView(fresh ?? application);
  }

  async getStatus(ctx: CallerContext) {
    const application = await this.requireCurrent(ctx.orgId);
    return this.toClientView(application);
  }

  // ------------------------------------------------------------------
  // Scoring
  // ------------------------------------------------------------------

  @Cron(CronExpression.EVERY_MINUTE)
  async scoreSubmittedApplications(): Promise<void> {
    const pending = await this.applicationRepository.find({
      where: { applicationStatus: ApplicationStatusEnum.SUBMITTED },
      take: 20,
    });
    for (const application of pending) {
      await this.tryScore(application.id);
    }
  }

  /** Runs Filter-1 default-profile scoring; silently defers when the
   * financial credit report has not flowed through the pipeline yet. */
  async tryScore(applicationId: number): Promise<void> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['riskApplicationScoring'],
    });
    if (!application || application.applicationStatus !== ApplicationStatusEnum.SUBMITTED) return;

    try {
      if (!application.riskApplicationScoring) {
        const defaultProfile = await this.riskProfileRepository.findOne({
          where: { isDefault: 1 },
        });
        if (!defaultProfile) throw new ServiceUnavailableException('No default risk profile seeded');
        await this.dataSource.getRepository(RiskApplicationScoring).save(
          new RiskApplicationScoring({
            applicationId: application.id,
            riskProfileId: defaultProfile.id,
          } as Partial<RiskApplicationScoring> as RiskApplicationScoring),
        );
      }
      await this.scoringService.create(application.applicationNumber);
    } catch (error) {
      // Most commonly: financial credit report not extracted yet.
      this.logger.log(
        `Scoring deferred for ${application.applicationNumber}: ${(error as Error).message}`,
      );
      return;
    }

    const scored = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['riskApplicationScoring'],
    });
    const scoring = scored?.riskApplicationScoring;
    if (!scored || !scoring || scoring.riskFilter1Category === null) return;

    // Pass rule (pass 1): Filter-1 category LOW or MEDIUM = pass, HIGH =
    // fail (Filter-1 orientation: high score = LOW risk).
    const passed = scoring.riskFilter1Category !== RiskCategoryEnum.HIGH;

    await this.dataSource.transaction(async (manager) => {
      scored.applicationStatus = passed
        ? ApplicationStatusEnum.SCORED_PASS
        : ApplicationStatusEnum.SCORED_FAIL;
      scored.scoredAt = new Date();
      await manager.save(Application, scored);
      scoring.riskFilter1Status = passed
        ? RiskFilter1StatusEnum.APPROVED
        : RiskFilter1StatusEnum.REJECTED;
      await manager.save(RiskApplicationScoring, scoring);

      await this.emitScored(manager, scored, scoring, false);

      if (!passed) {
        // Blueprint: RM has 10 working days to engage and flip fail->pass,
        // else the application closes (SLA_BREACHED consumer below).
        await this.outboxEventRepository.record(manager, {
          id: uuid(),
          topic: KafkaTopicEnum.SLA_TIMER_START,
          payload: {
            eventId: uuid(),
            funderOrganizationId: scored.funderOrganizationId,
            slaCode: RM_ENGAGEMENT_SLA_CODE,
            subjectType: 'APPLICATION',
            subjectId: String(scored.id),
          } as Record<string, unknown>,
        });
      }
    });
    this.logger.log(
      `Application ${scored.applicationNumber} scored ${scored.applicationStatus} (filter-1 ${scoring.riskFilter1TotalScore}, ${scoring.riskFilter1Category})`,
    );
  }

  // ------------------------------------------------------------------
  // Funder-facing (RemotePermissionGuard on the controller)
  // ------------------------------------------------------------------

  async listIntake(funderOrgId: number, buckets: 'crc' | 'all') {
    const statuses =
      buckets === 'crc'
        ? [ApplicationStatusEnum.SCORED_PASS, ApplicationStatusEnum.IN_CRC_REVIEW]
        : [
            ApplicationStatusEnum.SUBMITTED,
            ApplicationStatusEnum.SCORED_PASS,
            ApplicationStatusEnum.SCORED_FAIL,
            ApplicationStatusEnum.IN_CRC_REVIEW,
            ApplicationStatusEnum.CLOSED_ARCHIVED,
          ];
    const qb = this.applicationRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.riskApplicationScoring', 'scoring')
      .where('a."applicationStatus" IN (:...statuses)', { statuses })
      .orderBy('a.updatedAt', 'ASC')
      .take(200);
    if (funderOrgId !== 0) {
      qb.andWhere('a."funderOrganizationId" = :funderOrgId', { funderOrgId });
    }
    const rows = await qb.getMany();
    return rows.map((a) => this.toFunderView(a));
  }

  async getIntakeDetail(funderOrgId: number, id: number) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['riskApplicationScoring'],
    });
    if (!application || (funderOrgId !== 0 && application.funderOrganizationId !== funderOrgId)) {
      throw new NotFoundException('Application not found');
    }
    return { ...this.toFunderView(application), applicationPayload: application.applicationPayload ?? {} };
  }

  /** RM flips a Filter-1 FAIL to pass (blueprint: recorded in the system
   * log; the application then queues for CRC like any pass). */
  async overrideFailToPass(funderOrgId: number, personId: number, id: number) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['riskApplicationScoring'],
    });
    if (!application || (funderOrgId !== 0 && application.funderOrganizationId !== funderOrgId)) {
      throw new NotFoundException('Application not found');
    }
    if (application.applicationStatus !== ApplicationStatusEnum.SCORED_FAIL) {
      throw new BadRequestException('Only failed applications can be overridden to pass');
    }
    await this.dataSource.transaction(async (manager) => {
      application.applicationStatus = ApplicationStatusEnum.SCORED_PASS;
      application.statusOverriddenByPersonId = personId;
      application.statusOverriddenAt = new Date();
      await manager.save(Application, application);
      await manager.save(
        RiskAuditLog,
        manager.create(RiskAuditLog, {
          event: RiskAuditEvent.APPLICATION_STATUS_OVERRIDDEN,
          riskProfileCode: application.applicationNumber,
          actorPersonId: personId,
          payload: {
            applicationId: application.id,
            funderOrganizationId: application.funderOrganizationId,
            from: ApplicationStatusEnum.SCORED_FAIL,
            to: ApplicationStatusEnum.SCORED_PASS,
          },
        }),
      );
      if (application.riskApplicationScoring) {
        await this.emitScored(manager, application, application.riskApplicationScoring, true);
      }
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.SLA_TIMER_CANCEL,
        payload: {
          eventId: uuid(),
          funderOrganizationId: application.funderOrganizationId,
          slaCode: RM_ENGAGEMENT_SLA_CODE,
          subjectType: 'APPLICATION',
          subjectId: String(application.id),
        } as Record<string, unknown>,
      });
    });
    return { ok: true, status: ApplicationStatusEnum.SCORED_PASS };
  }

  /** SLA_BREACHED consumer path: the RM engagement window lapsed. */
  async closeOnEngagementBreach(applicationId: number): Promise<void> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application || application.applicationStatus !== ApplicationStatusEnum.SCORED_FAIL) return;
    application.applicationStatus = ApplicationStatusEnum.CLOSED_ARCHIVED;
    application.closedAt = new Date();
    await this.applicationRepository.save(application);
    this.logger.log(
      `Application ${application.applicationNumber} closed — RM engagement window breached`,
    );
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private async emitScored(
    manager: import('typeorm').EntityManager,
    application: Application,
    scoring: RiskApplicationScoring,
    overridden: boolean,
  ) {
    await this.outboxEventRepository.record(manager, {
      id: uuid(),
      topic: KafkaTopicEnum.APPLICATION_SCORED,
      payload: {
        eventId: uuid(),
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        funderOrganizationId: application.funderOrganizationId,
        organizationId: application.organizationId,
        companyName: application.clientOrganizationName,
        productCode: application.productCode,
        filter1Score: Number(scoring.riskFilter1TotalScore ?? 0),
        filter1Category: scoring.riskFilter1Category,
        result:
          application.applicationStatus === ApplicationStatusEnum.SCORED_PASS ? 'PASS' : 'FAIL',
        overridden,
        submittedAt: application.submittedAt,
      } as Record<string, unknown>,
    });
  }

  private async findCurrent(orgId: number): Promise<Application | null> {
    return this.applicationRepository.findOne({
      where: {
        organizationId: orgId,
        applicationStatus: In([
          ApplicationStatusEnum.DRAFT,
          ApplicationStatusEnum.SUBMITTED,
          ApplicationStatusEnum.SCORED_PASS,
          ApplicationStatusEnum.SCORED_FAIL,
          ApplicationStatusEnum.IN_CRC_REVIEW,
        ]),
      },
      order: { id: 'DESC' },
      relations: ['riskApplicationScoring'],
    });
  }

  private async requireCurrent(orgId: number): Promise<Application> {
    const application = await this.findCurrent(orgId);
    if (!application) throw new NotFoundException('No active application — start one first');
    return application;
  }

  private toClientView(a: Application) {
    const scoring = a.riskApplicationScoring;
    return {
      id: a.id,
      applicationNumber: a.applicationNumber,
      status: a.applicationStatus,
      productCode: a.productCode ?? null,
      payload: a.applicationPayload ?? {},
      submittedAt: a.submittedAt ?? null,
      scoredAt: a.scoredAt ?? null,
      // The client sees the outcome, never the raw score/band mechanics.
      outcome:
        a.applicationStatus === ApplicationStatusEnum.SCORED_PASS ||
        a.applicationStatus === ApplicationStatusEnum.IN_CRC_REVIEW
          ? 'UNDER_REVIEW'
          : a.applicationStatus === ApplicationStatusEnum.SCORED_FAIL
            ? 'ADDITIONAL_REVIEW_REQUIRED'
            : a.applicationStatus === ApplicationStatusEnum.CLOSED_ARCHIVED
              ? 'CLOSED'
              : null,
      updatedAt: a.updatedAt,
      hasScoring: !!scoring?.riskFilter1Category,
    };
  }

  private toFunderView(a: Application) {
    const scoring = a.riskApplicationScoring;
    return {
      id: a.id,
      applicationNumber: a.applicationNumber,
      status: a.applicationStatus,
      companyName: a.clientOrganizationName,
      organizationId: a.organizationId,
      funderOrganizationId: a.funderOrganizationId,
      productCode: a.productCode ?? null,
      filter1Score: scoring?.riskFilter1TotalScore !== undefined && scoring?.riskFilter1TotalScore !== null
        ? Number(scoring.riskFilter1TotalScore)
        : null,
      filter1Category: scoring?.riskFilter1Category ?? null,
      complianceFlags: a.complianceFlags ?? null,
      submittedAt: a.submittedAt ?? null,
      scoredAt: a.scoredAt ?? null,
      overriddenByPersonId: a.statusOverriddenByPersonId ?? null,
      updatedAt: a.updatedAt,
    };
  }

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
      throw new ServiceUnavailableException('Onboarding configuration unavailable');
    }
  }
}
