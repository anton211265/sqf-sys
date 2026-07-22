import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';
import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { AuthAuditEvent } from '../../models/auth-audit-log.entity';
import {
  EnrollmentToken,
  Person,
  WebauthnCredential,
} from '../../models';
import {
  EnrollmentTokenRepository,
  OrganizationPersonRepository,
  PersonRepository,
  WebauthnCredentialRepository,
} from '../../repositories';
import { AuthAuditLogRepository } from '../../repositories/auth-audit-log.repository';
import { AuthService } from '../auth.service';
import { TtlMap } from './ttl-map';

interface RegistrationChallenge {
  challenge: string;
  personId: number;
  enrollmentTokenId: number | null;
}

interface AssertionChallenge {
  challenge: string;
  personId: number;
  orgId: number;
  purpose: 'login' | 'reauth';
}

const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const ENROLLMENT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);

  private readonly rpId: string;
  private readonly rpName = 'SQF';
  private readonly expectedOrigins: string[];

  private readonly registrationChallenges = new TtlMap<RegistrationChallenge>(
    CHALLENGE_TTL_MS,
  );
  private readonly assertionChallenges = new TtlMap<AssertionChallenge>(
    CHALLENGE_TTL_MS,
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly personRepository: PersonRepository,
    private readonly organizationPersonRepository: OrganizationPersonRepository,
    private readonly credentialRepository: WebauthnCredentialRepository,
    private readonly enrollmentTokenRepository: EnrollmentTokenRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    private readonly authService: AuthService,
  ) {
    // localhost is a WebAuthn-secure context, so dev needs no TLS; production
    // must set WEBAUTHN_RP_ID to the real domain (requires HTTPS).
    this.rpId = this.configService.get<string>('WEBAUTHN_RP_ID') ?? 'localhost';
    this.expectedOrigins = (
      this.configService.get<string>('WEBAUTHN_ORIGINS') ??
      this.configService.getOrThrow<string>('FRONTEND_DOMAIN')
    )
      .split(',')
      .map((o) => o.trim());
  }

  // --------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------

  /** First-passkey enrollment via a one-time enrollment token (no session). */
  async registrationOptionsForEnrollment(rawToken: string): Promise<{
    registrationSessionId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
    email: string;
  }> {
    const enrollment = await this.enrollmentTokenRepository.findUsableByTokenHash(
      this.sha256(rawToken),
    );
    if (!enrollment) {
      throw new UnauthorizedException(
        'Enrollment link is invalid or has expired',
      );
    }

    const { registrationSessionId, options } = await this.buildRegistrationOptions(
      enrollment.person,
      enrollment.id,
    );
    return { registrationSessionId, options, email: enrollment.person.email };
  }

  /** Additional-device registration for an already-authenticated user. */
  async registrationOptionsForUser(personId: number): Promise<{
    registrationSessionId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
    email: string;
  }> {
    const person = await this.personRepository.findOne({
      where: { id: personId },
    });
    if (!person) throw new UnauthorizedException('Unknown user');

    const { registrationSessionId, options } = await this.buildRegistrationOptions(
      person,
      null,
    );
    return { registrationSessionId, options, email: person.email };
  }

  private async buildRegistrationOptions(
    person: Person,
    enrollmentTokenId: number | null,
  ): Promise<{
    registrationSessionId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
  }> {
    const existing = await this.credentialRepository.findActiveByPersonId(
      person.id,
    );

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userID: String(person.id),
      userName: person.email,
      userDisplayName: person.name ?? person.email,
      attestationType: 'none',
      excludeCredentials: existing.map((credential) => ({
        id: isoBase64URL.toBuffer(credential.credentialId),
        type: 'public-key' as const,
        transports: this.parseTransports(credential.transports),
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        // Financial platform: biometric/PIN presence is mandatory (Bank Negara MFA)
        userVerification: 'required',
      },
    });

    const registrationSessionId = uuid();
    this.registrationChallenges.set(registrationSessionId, {
      challenge: options.challenge,
      personId: person.id,
      enrollmentTokenId,
    });

    return { registrationSessionId, options };
  }

  async verifyRegistration(
    registrationSessionId: string,
    response: RegistrationResponseJSON,
    label: string | null,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<{ verified: true; credentialId: string }> {
    const entry = this.registrationChallenges.take(registrationSessionId);
    if (!entry) {
      throw new UnauthorizedException('Registration session expired');
    }

    const person = await this.personRepository.findOne({
      where: { id: entry.personId },
    });
    if (!person) throw new UnauthorizedException('Unknown user');

    let verified = false;
    let registrationInfo;
    try {
      const result = await verifyRegistrationResponse({
        response,
        expectedChallenge: entry.challenge,
        expectedOrigin: this.expectedOrigins,
        expectedRPID: this.rpId,
        requireUserVerification: true,
      });
      verified = result.verified;
      registrationInfo = result.registrationInfo;
    } catch (err) {
      this.logger.warn(`Passkey registration verification failed: ${err}`);
    }

    if (!verified || !registrationInfo) {
      await this.auditLogRepository.record({
        event: AuthAuditEvent.PASSKEY_REGISTRATION_FAILURE,
        email: person.email,
        outcome: 'FAILURE',
        personId: person.id,
        ipAddress,
        userAgent,
        detail: 'Attestation verification failed',
      });
      throw new UnauthorizedException('Passkey registration failed');
    }

    // One-time enrollment tokens are consumed exactly once — re-check under
    // the unique row rather than trusting the options-time read.
    if (entry.enrollmentTokenId !== null) {
      const enrollment = await this.enrollmentTokenRepository.findOne({
        where: { id: entry.enrollmentTokenId },
      });
      if (!enrollment || enrollment.usedAt !== null) {
        throw new UnauthorizedException(
          'Enrollment link has already been used',
        );
      }
      enrollment.usedAt = new Date();
      await this.enrollmentTokenRepository.save(enrollment);
    }

    const credentialId = isoBase64URL.fromBuffer(registrationInfo.credentialID);
    await this.credentialRepository.save(
      new WebauthnCredential({
        person,
        credentialId,
        publicKey: isoBase64URL.fromBuffer(registrationInfo.credentialPublicKey),
        counter: String(registrationInfo.counter),
        transports: response.response.transports?.join(',') ?? null,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        label: label ?? null,
        lastUsedAt: null,
        revokedAt: null,
      }),
    );

    await this.auditLogRepository.record({
      event: AuthAuditEvent.PASSKEY_REGISTERED,
      email: person.email,
      outcome: 'SUCCESS',
      personId: person.id,
      ipAddress,
      userAgent,
      detail: `credentialId=${credentialId}${label ? ` label=${label}` : ''}`,
    });

    return { verified: true, credentialId };
  }

  // --------------------------------------------------------------------
  // Login
  // --------------------------------------------------------------------

  async loginOptions(
    email: string,
    orgId: number,
  ): Promise<{
    loginSessionId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  }> {
    const person = await this.personRepository.findOne({ where: { email } });
    if (!person) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fail before the biometric prompt if the org selection is wrong
    if (!(person.systemRole === 'SQFSYS' && orgId === 0)) {
      const membership = await this.organizationPersonRepository.findOne({
        where: { person: { id: person.id }, organization: { id: orgId } },
      });
      if (!membership) {
        throw new UnauthorizedException(
          'You do not belong to this organization',
        );
      }
    }

    const credentials = await this.credentialRepository.findActiveByPersonId(
      person.id,
    );
    if (credentials.length === 0) {
      throw new UnauthorizedException(
        'No passkeys registered for this account. Ask an administrator for an enrollment link.',
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials: credentials.map((credential) => ({
        id: isoBase64URL.toBuffer(credential.credentialId),
        type: 'public-key' as const,
        transports: this.parseTransports(credential.transports),
      })),
      userVerification: 'required',
    });

    const loginSessionId = uuid();
    this.assertionChallenges.set(loginSessionId, {
      challenge: options.challenge,
      personId: person.id,
      orgId,
      purpose: 'login',
    });

    return { loginSessionId, options };
  }

  async verifyLogin(
    loginSessionId: string,
    response: AuthenticationResponseJSON,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const entry = this.assertionChallenges.take(loginSessionId);
    if (!entry || entry.purpose !== 'login') {
      throw new UnauthorizedException('Login session expired');
    }

    const credential = await this.verifyAssertion(entry, response, {
      userAgent,
      ipAddress,
    });

    return this.authService.issueSession(
      credential.person,
      entry.orgId,
      userAgent,
      ipAddress,
      AuthAuditEvent.PASSKEY_LOGIN_SUCCESS,
    );
  }

  // --------------------------------------------------------------------
  // Re-authentication (fresh biometric proof for QR approval)
  // --------------------------------------------------------------------

  async reauthOptions(personId: number, orgId: number): Promise<{
    reauthSessionId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  }> {
    const credentials = await this.credentialRepository.findActiveByPersonId(
      personId,
    );
    if (credentials.length === 0) {
      throw new UnauthorizedException('No passkeys registered for this account');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials: credentials.map((credential) => ({
        id: isoBase64URL.toBuffer(credential.credentialId),
        type: 'public-key' as const,
        transports: this.parseTransports(credential.transports),
      })),
      userVerification: 'required',
    });

    const reauthSessionId = uuid();
    this.assertionChallenges.set(reauthSessionId, {
      challenge: options.challenge,
      personId,
      orgId,
      purpose: 'reauth',
    });

    return { reauthSessionId, options };
  }

  /**
   * Verifies a fresh assertion for an already-authenticated user without
   * issuing tokens. Used by the QR flow: the phone must prove biometric
   * presence right now, not just hold a valid JWT.
   */
  async verifyReauth(
    reauthSessionId: string,
    response: AuthenticationResponseJSON,
    expectedPersonId: number,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<Person> {
    const entry = this.assertionChallenges.take(reauthSessionId);
    if (!entry || entry.purpose !== 'reauth') {
      throw new UnauthorizedException('Re-authentication session expired');
    }
    if (entry.personId !== expectedPersonId) {
      throw new UnauthorizedException('Re-authentication user mismatch');
    }

    const credential = await this.verifyAssertion(entry, response, {
      userAgent,
      ipAddress,
    });
    return credential.person;
  }

  private async verifyAssertion(
    entry: AssertionChallenge,
    response: AuthenticationResponseJSON,
    context: { userAgent: string | null; ipAddress: string | null },
  ): Promise<WebauthnCredential> {
    const failLogin = async (person: Person | null, detail: string) => {
      await this.auditLogRepository.record({
        event: AuthAuditEvent.PASSKEY_LOGIN_FAILURE,
        email: person?.email ?? 'unknown',
        outcome: 'FAILURE',
        personId: person?.id ?? entry.personId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        detail,
      });
      return new UnauthorizedException('Invalid credentials');
    };

    const credential = await this.credentialRepository.findActiveByCredentialId(
      response.id,
    );
    if (!credential || credential.person.id !== entry.personId) {
      throw await failLogin(
        credential?.person ?? null,
        'Unknown or mismatched credential',
      );
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: entry.challenge,
        expectedOrigin: this.expectedOrigins,
        expectedRPID: this.rpId,
        requireUserVerification: true,
        authenticator: {
          credentialID: isoBase64URL.toBuffer(credential.credentialId),
          credentialPublicKey: isoBase64URL.toBuffer(credential.publicKey),
          counter: Number(credential.counter),
          transports: this.parseTransports(credential.transports),
        },
      });
    } catch (err) {
      // Includes clone detection: SimpleWebAuthn rejects a signature counter
      // that did not advance past the stored value.
      throw await failLogin(
        credential.person,
        `Assertion verification failed: ${err}`,
      );
    }

    if (!verification.verified) {
      throw await failLogin(credential.person, 'Assertion not verified');
    }

    credential.counter = String(verification.authenticationInfo.newCounter);
    credential.lastUsedAt = new Date();
    await this.credentialRepository.save(credential);

    return credential;
  }

  // --------------------------------------------------------------------
  // Credential management
  // --------------------------------------------------------------------

  async listCredentials(personId: number) {
    const credentials = await this.credentialRepository.findActiveByPersonId(
      personId,
    );
    return credentials.map((credential) => ({
      id: credential.id,
      label: credential.label,
      deviceType: credential.deviceType,
      backedUp: credential.backedUp,
      transports: this.parseTransports(credential.transports) ?? [],
      createdAt: credential.createdAt,
      lastUsedAt: credential.lastUsedAt,
    }));
  }

  async renameCredential(personId: number, credentialRowId: number, label: string) {
    const credential = await this.findOwnActiveCredential(personId, credentialRowId);
    credential.label = label;
    await this.credentialRepository.save(credential);
    return { success: true };
  }

  async revokeCredential(
    personId: number,
    credentialRowId: number,
    userAgent: string | null,
    ipAddress: string | null,
  ) {
    const credential = await this.findOwnActiveCredential(personId, credentialRowId);

    const active = await this.credentialRepository.findActiveByPersonId(personId);
    if (active.length <= 1) {
      throw new BadRequestException(
        'Cannot revoke your only passkey — register another device first, or ask an administrator for an enrollment link.',
      );
    }

    credential.revokedAt = new Date();
    await this.credentialRepository.save(credential);

    await this.auditLogRepository.record({
      event: AuthAuditEvent.PASSKEY_REVOKED,
      email: credential.person.email,
      outcome: 'SUCCESS',
      personId,
      ipAddress,
      userAgent,
      detail: `credentialId=${credential.credentialId}`,
    });

    return { success: true };
  }

  private async findOwnActiveCredential(
    personId: number,
    credentialRowId: number,
  ): Promise<WebauthnCredential> {
    const credentials = await this.credentialRepository.findActiveByPersonId(
      personId,
    );
    const credential = credentials.find((c) => c.id === credentialRowId);
    if (!credential) {
      throw new BadRequestException('Passkey not found');
    }
    return credential;
  }

  // --------------------------------------------------------------------
  // Enrollment tokens
  // --------------------------------------------------------------------

  /**
   * Issues a one-time enrollment link for a person's first passkey.
   * Authorization: SQFSYS platform accounts, or a SUPERUSER of the caller's
   * org for members of that same org.
   * NOTE: intended role once Dynamic RBAC lands is Super Admin; per the
   * standing RBAC rule this is a direct check, not a new CASL rule.
   */
  async issueEnrollmentToken(
    requesterPersonId: number,
    requesterOrgId: number,
    targetEmail: string,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<{ enrollmentToken: string; enrollmentUrl: string; expiresAt: Date }> {
    const requester = await this.personRepository.findOne({
      where: { id: requesterPersonId },
    });
    if (!requester) throw new UnauthorizedException('Unknown requester');

    let authorized = requester.systemRole === 'SQFSYS';
    if (!authorized) {
      const membership = await this.organizationPersonRepository.findOne({
        where: {
          person: { id: requesterPersonId },
          organization: { id: requesterOrgId },
        },
        relations: ['organizationPersonRoles'],
      });
      authorized = (membership?.organizationPersonRoles ?? []).some(
        (role) => role.role === OrganizationPersonRoleEnum.SUPERUSER,
      );
    }
    if (!authorized) {
      throw new ForbiddenException(
        'Only SQFSYS or a SUPERUSER can issue enrollment links',
      );
    }

    const target = await this.personRepository.findOne({
      where: { email: targetEmail },
    });
    if (!target) throw new BadRequestException('No account with that email');

    // Non-SQFSYS issuers can only enroll members of their own organization
    if (requester.systemRole !== 'SQFSYS') {
      const targetMembership = await this.organizationPersonRepository.findOne({
        where: {
          person: { id: target.id },
          organization: { id: requesterOrgId },
        },
      });
      if (!targetMembership) {
        throw new ForbiddenException(
          'Target user is not a member of your organization',
        );
      }
    }

    const rawToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + ENROLLMENT_TOKEN_TTL_MS);

    await this.enrollmentTokenRepository.save(
      new EnrollmentToken({
        person: target,
        tokenHash: this.sha256(rawToken),
        expiresAt,
        usedAt: null,
        createdByPersonId: requesterPersonId,
      }),
    );

    await this.auditLogRepository.record({
      event: AuthAuditEvent.ENROLLMENT_TOKEN_ISSUED,
      email: target.email,
      outcome: 'SUCCESS',
      personId: target.id,
      ipAddress,
      userAgent,
      detail: `issuedBy=${requester.email}`,
    });

    return {
      enrollmentToken: rawToken,
      enrollmentUrl: this.buildEnrollmentUrl(rawToken),
      expiresAt,
    };
  }

  buildEnrollmentUrl(rawToken: string): string {
    // Token travels in the URL fragment so it never reaches server/proxy logs
    return `${this.expectedOrigins[0]}/enroll#token=${rawToken}`;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private parseTransports(
    transports: string | null,
  ): AuthenticatorTransportFuture[] | undefined {
    if (!transports) return undefined;
    return transports.split(',') as AuthenticatorTransportFuture[];
  }
}

type AuthenticatorTransportFuture = NonNullable<
  RegistrationResponseJSON['response']['transports']
>[number];
