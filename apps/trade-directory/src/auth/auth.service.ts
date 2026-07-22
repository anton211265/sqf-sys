import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import {
  FunderPersona,
  Organization,
  OrganizationPerson,
  Person,
  Token,
} from '../models';
import {
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { DecodedToken } from './types/decoded-token';
import { TokenRepository } from '../repositories/token.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RefreshResponseDto } from './dto/response/refresh-response.dto';
import { TokenPayload } from './interface/token.interface';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { OrganizationsResponseDto } from './dto/response/organizations-response.dto';
import { LogoutResponseDto } from './dto/response/logout-response.dto';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { AuthAuditLogRepository } from '../repositories/auth-audit-log.repository';
import { AuthAuditEvent } from '../models/auth-audit-log.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwksClient: jwksClient.JwksClient;
  private readonly ENTRA_TENANT_ID: string;
  private readonly ENTRA_APPLICATION_ID: string;

  // TO REFACTOR
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly configService: ConfigService,
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private readonly organizationPersonRepository: OrganizationPersonRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {
    this.ENTRA_TENANT_ID = this.configService.getOrThrow('ENTRA_TENANT_ID');
    this.ENTRA_APPLICATION_ID = this.configService.getOrThrow(
      'ENTRA_APPLICATION_ID',
    );

    this.jwksClient = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${this.ENTRA_TENANT_ID}/discovery/v2.0/keys`,
    });
  }

  async organizations(email: string): Promise<OrganizationsResponseDto> {
    const person = await this.personRepository.findOne({
      where: { email },
      relations: ['organizationPersons', 'organizationPersons.organization'],
    });

    if (!person) {
      throw new NotFoundException('Email is invalid');
    }

    // SQFSYS accounts have no org membership — return sentinel so frontend can proceed
    if (person.systemRole === 'SQFSYS') {
      return { organizations: [{ id: 0, name: 'SQF System' }] };
    }

    const seen = new Set<number>();
    const uniqueOrganizations = [];

    for (const orgPerson of person.organizationPersons || []) {
      const org = orgPerson.organization;

      if (org && !seen.has(org.id)) {
        seen.add(org.id);
        uniqueOrganizations.push({
          id: org.id,
          name: org.organizationName,
        });
      }
    }

    return { organizations: uniqueOrganizations };
  }

  /**
   * Mints a fresh access/refresh token pair for an already-authenticated
   * person. Authentication itself now happens exclusively via WebAuthn
   * passkeys (PasskeyService) — password login was removed 2026-07-22.
   * Callers: passkey login-verify and QR login complete.
   */
  async issueSession(
    user: Person,
    orgId: number,
    userAgent: string | null = null,
    ipAddress: string | null = null,
    auditEvent: AuthAuditEvent = AuthAuditEvent.PASSKEY_LOGIN_SUCCESS,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // SQFSYS accounts have no org — sentinel orgId 0 bypasses the membership check
    if (!(user.systemRole === 'SQFSYS' && orgId === 0)) {
      const membership = await this.organizationPersonRepository.findOne({
        where: {
          person: { id: user.id },
          organization: { id: orgId },
        },
      });

      if (!membership) {
        throw new UnauthorizedException(
          'You do not belong to this organization',
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tokenPayload: TokenPayload = { userId: user.id, orgId };

    const accessToken = this.jwtService.sign(tokenPayload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(tokenPayload, { expiresIn: '7d' });
    const refreshTokenHash = await bcrypt.hash(this.tokenDigest(refreshToken), 10);

    const token = new Token({
      person: user,
      refreshTokenHash,
      issuedAt: now,
      lastUsedAt: now,
      expiresAt,
      revokedAt: null,
      revokedReason: null,
      userAgent,
      ipAddress,
      tokenFamilyId: uuid(),
    });

    await this.tokenRepository.save(token);
    await this.auditLogRepository.record({
      event: auditEvent,
      email: user.email,
      outcome: 'SUCCESS',
      personId: user.id,
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    refreshToken: string,
    userAgent: string | null = null,
    ipAddress: string | null = null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let tokenPayload: TokenPayload;

    try {
      const full = this.jwtService.verify(refreshToken);
      tokenPayload = { userId: full.userId, orgId: full.orgId };
    } catch (err) {
      await this.auditLogRepository.record({
        event: AuthAuditEvent.REFRESH_FAILURE,
        email: 'unknown',
        outcome: 'FAILURE',
        ipAddress,
        userAgent,
        detail: 'JWT verification failed',
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // First: check active tokens. DB IS NULL filter avoids TypeORM identity-map ambiguity.
    const activeTokens = await this.tokenRepository.findActiveByPersonId(tokenPayload.userId);
    let matchedToken: Token | null = null;
    for (const candidate of activeTokens) {
      if (!candidate.refreshTokenHash.startsWith('$2b$')) continue;
      const matches = await bcrypt.compare(this.tokenDigest(refreshToken), candidate.refreshTokenHash);
      if (matches) { matchedToken = candidate; break; }
    }

    // Second: if no active match, check revoked tokens for theft detection.
    if (!matchedToken) {
      const revokedTokens = await this.tokenRepository.findRevokedByPersonId(tokenPayload.userId);
      let revokedMatch = false;
      for (const candidate of revokedTokens) {
        if (!candidate.refreshTokenHash.startsWith('$2b$')) continue;
        const matches = await bcrypt.compare(this.tokenDigest(refreshToken), candidate.refreshTokenHash);
        if (matches) { revokedMatch = true; break; }
      }

      if (revokedMatch) {
        this.logger.warn(`Token reuse detected for personId ${tokenPayload.userId} — revoking session family`);
        const now = new Date();

        // Revoke every active token in the same family chain
        const familyTokens = revokedTokens.length > 0
          ? await this.tokenRepository.findActiveByFamilyId(revokedTokens[0]?.tokenFamilyId ?? '')
          : activeTokens;
        const toRevoke = familyTokens.length > 0 ? familyTokens : activeTokens;

        for (const active of toRevoke) {
          active.revokedAt = now;
          active.revokedReason = 'ROTATION_ABUSE';
        }
        await this.tokenRepository.saveMany(toRevoke);

        // Alert the account owner via email
        const person = await this.personRepository.findOne({ where: { id: tokenPayload.userId } });
        if (person) {
          await this.entityManager.transaction(async (manager) => {
            await this.outboxEventRepository.record(manager, {
              id: uuid(),
              topic: KafkaTopicEnum.SEND_EMAIL,
              payload: {
                eventId: uuid(),
                emailSender: 'notification@sqf.ai',
                emailReceivers: [person.email],
                emailCc: [],
                emailBcc: [],
                emailReplyTo: [],
                emailSubject: 'SQF.AI - Security Alert: Unusual Activity Detected',
                emailTemplate: {
                  templateName: '/security-alert.pug',
                  templateVariables: {
                    recipientName: person.name ?? person.email,
                  },
                },
              } as Record<string, unknown>,
            });
          });
        }

        await this.auditLogRepository.record({
          event: AuthAuditEvent.REFRESH_THEFT,
          email: 'unknown',
          outcome: 'FAILURE',
          personId: tokenPayload.userId,
          ipAddress,
          userAgent,
          detail: 'Revoked token replayed — session family terminated',
        });
        throw new UnauthorizedException('Token reuse detected. All sessions have been revoked.');
      }

      await this.auditLogRepository.record({
        event: AuthAuditEvent.REFRESH_FAILURE,
        email: 'unknown',
        outcome: 'FAILURE',
        personId: tokenPayload.userId,
        ipAddress,
        userAgent,
        detail: 'No matching active token',
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (matchedToken.expiresAt < new Date()) {
      matchedToken.revokedAt = new Date();
      matchedToken.revokedReason = 'FORCE_REVOKE';
      await this.tokenRepository.save(matchedToken);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Rotate — revoke the old record and issue a fresh one
    const now = new Date();
    matchedToken.revokedAt = now;
    matchedToken.revokedReason = 'ROTATED';
    await this.tokenRepository.save(matchedToken);

    const newAccessToken = this.jwtService.sign(tokenPayload, { expiresIn: '15m' });
    const newRefreshToken = this.jwtService.sign(tokenPayload, { expiresIn: '7d' });
    const newRefreshTokenHash = await bcrypt.hash(this.tokenDigest(newRefreshToken), 10);

    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const newTokenRecord = new Token({
      person: matchedToken.person,
      refreshTokenHash: newRefreshTokenHash,
      issuedAt: matchedToken.issuedAt,
      lastUsedAt: now,
      expiresAt,
      revokedAt: null,
      revokedReason: null,
      userAgent: matchedToken.userAgent,
      ipAddress: matchedToken.ipAddress,
      tokenFamilyId: matchedToken.tokenFamilyId,
    });
    await this.tokenRepository.save(newTokenRecord);
    await this.auditLogRepository.record({
      event: AuthAuditEvent.REFRESH_SUCCESS,
      email: 'unknown',
      outcome: 'SUCCESS',
      personId: tokenPayload.userId,
      ipAddress,
      userAgent,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(
    refreshToken: string,
    userAgent: string | null = null,
    ipAddress: string | null = null,
  ): Promise<LogoutResponseDto> {
    let personId: number;

    try {
      const payload = this.jwtService.verify(refreshToken);
      personId = payload.userId;
    } catch (err) {
      // Token is expired or invalid — nothing to revoke
      return { message: 'Logged out successfully' };
    }

    const activeTokens = await this.tokenRepository.findActiveByPersonId(personId);

    for (const candidate of activeTokens) {
      const matches = await bcrypt.compare(this.tokenDigest(refreshToken), candidate.refreshTokenHash);
      if (matches) {
        candidate.revokedAt = new Date();
        candidate.revokedReason = 'LOGOUT';
        await this.tokenRepository.save(candidate);
        break;
      }
    }

    await this.auditLogRepository.record({
      event: AuthAuditEvent.LOGOUT,
      email: 'unknown',
      outcome: 'SUCCESS',
      personId,
      ipAddress,
      userAgent,
    });

    return { message: 'Logged out successfully' };
  }

  private tokenDigest(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupRevokedTokens(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.tokenRepository.deleteRevokedBefore(cutoff);
    this.logger.log('Cleaned up revoked tokens older than 30 days');
  }

  async userContext(
    userId: number,
    orgId: number,
  ): Promise<IUserContext> {
    const person = await this.personRepository.findOne({
      where: { id: userId },
    });

    if (!person) {
      throw new NotFoundException('User not found');
    }

    return { id: userId, orgId };
  }

  async kafkaAuthenticate(token: string): Promise<IUserContext> {
    let tokenPayload: TokenPayload;

    try {
      tokenPayload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { userId, orgId } = tokenPayload;

    return this.userContext(userId, orgId);
  }

  authenticate = async (token: string) => {
    if (!token) {
      throw new NotFoundException('Token not found');
    }
    let decodedToken;
    try {
      decodedToken = jwt.decode(token, { complete: true });
    } catch (error: unknown) {
      this.logger.error(error);
      throw new UnauthorizedException('Failed to verify token');
    }
    if (!decodedToken) {
      throw new UnauthorizedException('Failed to verify token');
    }
    let verifiedDecodedToken: DecodedToken;
    let signingKey;

    try {
      const keys = await this.jwksClient.getSigningKey(decodedToken.header.kid);
      signingKey = keys.getPublicKey();
    } catch (error) {
      this.logger.error('Error getting signing key');
      throw error;
    }

    try {
      verifiedDecodedToken = jwt.verify(token, signingKey, {
        issuer: `https://login.microsoftonline.com/${this.ENTRA_TENANT_ID}/v2.0`,
        audience: this.ENTRA_APPLICATION_ID,
      }) as DecodedToken;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Token is not valid');
    }

    const userOrganization = await this.getUserOrganization();
    let userOrganizationPerson = userOrganization.organizationPersons.find(
      (organizationPerson) =>
        organizationPerson.sub === verifiedDecodedToken.sub,
    );

    if (!userOrganizationPerson) {
      const userPerson = await this.getUserPerson(verifiedDecodedToken);
      this.logger.log(
        'User not found in organization, adding user to organization',
      );
      userOrganizationPerson = new OrganizationPerson({
        person: userPerson,
        sub: verifiedDecodedToken.sub,
        organizationPersonRoles: [],
      });
      userOrganization.organizationPersons.push(userOrganizationPerson);
      await this.organizationRepository.save(userOrganization);
    }

    const response: AuthResponseDto = {
      personId: userOrganizationPerson.person.id,
      name: userOrganizationPerson.person.name,
      preferredUsername: userOrganizationPerson.person.preferredUsername,
      identificationNumber: userOrganizationPerson.person.identificationNumber,
      mobileNumber: userOrganizationPerson.person.mobileNumber,
      email: userOrganizationPerson.person.email,
      sub: userOrganizationPerson.sub,
      organizationPersonId: userOrganizationPerson.id,
      organizationPersonRoles:
        userOrganizationPerson.organizationPersonRoles.map(
          (organizationPersonRole) => ({
            role: organizationPersonRole.role,
          }),
        ),
      organizationId: userOrganization.id,
      clientPersonaId: userOrganization.clientPersona?.id,
      buyerPersonaId: userOrganization.buyerPersona?.id,
      supplierPersonaId: userOrganization.supplierPersona?.id,
      funderPersonaId: userOrganization.funderPersona?.id,
    };
    return response;
  };

  private getUserOrganization = async () => {
    const existingUserOrganization = await this.organizationRepository.findOne({
      where: {
        organizationName: this.ENTRA_TENANT_ID,
      },
      relations: {
        organizationPersons: {
          organizationPersonRoles: true,
          person: true,
        },
        clientPersona: true,
        buyerPersona: true,
        supplierPersona: true,
        funderPersona: true,
      },
    });
    if (existingUserOrganization) {
      return existingUserOrganization;
    }

    this.logger.log(
      'User organization not found, creating organization entity',
    );
    const newUserOrganization = new Organization({
      organizationName: this.ENTRA_TENANT_ID,
      funderPersona: new FunderPersona(),
    });
    await this.organizationRepository.save(newUserOrganization);

    const userOrganization =
      await this.organizationRepository.findOneOrThrowException({
        where: {
          organizationName: this.ENTRA_TENANT_ID,
        },
        relations: {
          organizationPersons: {
            organizationPersonRoles: true,
            person: true,
          },
          clientPersona: true,
          buyerPersona: true,
          supplierPersona: true,
          funderPersona: true,
        },
      });
    return userOrganization;
  };

  private getUserPerson = async (decodedToken: DecodedToken) => {
    const existingUserPerson = await this.personRepository.findOne({
      where: {
        name: decodedToken.name,
        preferredUsername: decodedToken.preferred_username,
        email: decodedToken.preferred_username,
      },
    });

    if (existingUserPerson) {
      return existingUserPerson;
    }

    // seeded persons does not have some info, update it
    const seededUserPerson = await this.personRepository.findOne({
      where: {
        email: decodedToken.preferred_username,
      },
    });
    if (seededUserPerson) {
      this.logger.log('Seeded user found, updating person entity for user');
      seededUserPerson.name = decodedToken.name;
      seededUserPerson.preferredUsername = decodedToken.preferred_username;
      await this.personRepository.save(seededUserPerson);
      return seededUserPerson;
    }

    this.logger.log('User not found, creating person entity for user');
    const newUser = new Person({
      name: decodedToken.name,
      preferredUsername: decodedToken.preferred_username,
      email: decodedToken.preferred_username,
    });
    const userPerson = await this.personRepository.save(newUser);
    return userPerson;
  };
}
