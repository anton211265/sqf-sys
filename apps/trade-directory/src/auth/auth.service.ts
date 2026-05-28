import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import {
  FactorPersona,
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
import { ResetPasswordDto } from './dto/request/reset-password.dto';
import { MoreThanOrEqual } from 'typeorm';
import { ResetPasswordTokenRepository } from '../repositories/reset-password-token.repository';

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
    private readonly resetRepository: ResetPasswordTokenRepository,

    private readonly organizationPersonRepository: OrganizationPersonRepository,
  ) {
    this.ENTRA_TENANT_ID = this.configService.getOrThrow('ENTRA_TENANT_ID');
    this.ENTRA_APPLICATION_ID = this.configService.getOrThrow(
      'ENTRA_APPLICATION_ID',
    );

    this.jwksClient = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${this.ENTRA_TENANT_ID}/discovery/v2.0/keys`,
    });
  }

  dummyAuthenticate = async (data: {
    username: string;
    password: string;
    inputOrganizationName: string;
    inputOrganizationPersonName: string;
  }) => {
    if (
      data.username !== 'dummy_username-123' ||
      data.password !== 'mUutgR%JDVHUT8R@H7u2'
    ) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const userOrganization = await this.organizationRepository.findOne({
      where: {
        organizationName: data.inputOrganizationName,
      },
      relations: {
        organizationPersons: {
          organizationPersonRoles: true,
          person: true,
        },
        clientPersona: true,
        contractAwarderPersona: true,
        supplierPersona: true,
        factorPersona: true,
      },
    });
    if (!userOrganization) {
      throw new BadRequestException('Unable to find user organization');
    }

    const userOrganizationPerson = userOrganization.organizationPersons.find(
      (organizationPerson) =>
        organizationPerson.person.name === data.inputOrganizationPersonName,
    );

    if (!userOrganizationPerson) {
      throw new BadRequestException('Unable to find user organization person');
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
      contractAwarderPersonaId: userOrganization.contractAwarderPersona?.id,
      supplierPersonaId: userOrganization.supplierPersona?.id,
      factorPersonaId: userOrganization.factorPersona?.id,
    };
    return response;
  };

  async organizations(email: string): Promise<OrganizationsResponseDto> {
    const person = await this.personRepository.findOne({
      where: { email },
      relations: ['organizationPersons', 'organizationPersons.organization'],
    });

    if (!person) {
      throw new NotFoundException('Email is invalid');
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

  async login(
    email: string,
    password: string,
    orgId: number,
  ): Promise<LoginResponseDto> {
    const user = await this.personRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.organizationPersonRepository.findOne({
      where: {
        person: { id: user.id },
        organization: { id: orgId },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('You do not belong to this organization');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      orgId,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '7d',
    });

    const token = new Token({ accessToken, refreshToken, person: user });

    await this.tokenRepository.save(token);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    let tokenPayload: TokenPayload;

    try {
      const full = this.jwtService.verify(refreshToken);
      tokenPayload = { userId: full.userId, orgId: full.orgId };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenRecord = await this.tokenRepository.findOne({
      where: { refreshToken },
      relations: ['person'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('No token record');
    }

    const newAccessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: '15m',
    });

    tokenRecord.accessToken = newAccessToken;
    await this.tokenRepository.save(tokenRecord);

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string): Promise<LogoutResponseDto> {
    await this.tokenRepository.delete({ refreshToken });

    return { message: 'Logged out successfully' };
  }

  async userContext(
    userId: number,
    orgId: number,
    token: string,
  ): Promise<IUserContext> {
    const person = await this.personRepository.findOne({
      where: { id: userId },
    });

    if (!person) {
      throw new NotFoundException('User not found');
    }

    const tokenRecord = await this.tokenRepository.findOne({
      where: { person: { id: userId }, accessToken: token },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('No token record');
    }

    const userContext: IUserContext = {
      id: userId,
      orgId,
    };

    return userContext;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password, confirmPassword } = resetPasswordDto;
    if (password !== confirmPassword) {
      throw new BadRequestException('Password do not match');
    }

    let reset = null;
    reset = await this.resetRepository.findOne({
      where: {
        token,
        tokenExpirationAt: MoreThanOrEqual(new Date(Date.now())),
      },
    });

    if (!reset) {
      throw new BadRequestException('Invalid token');
    }

    const user = await this.personRepository.findOne({
      where: { email: reset.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.personRepository.update(
      { id: user.id },
      { password: await bcrypt.hash(password, 10) },
    );

    this.resetRepository.delete({ id: reset.id });

    return {
      message: 'success',
    };
  }

  async kafkaAuthenticate(token: string): Promise<IUserContext> {
    let tokenPayload: TokenPayload;

    try {
      tokenPayload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { userId, orgId } = tokenPayload;

    return this.userContext(userId, orgId, token);
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
      contractAwarderPersonaId: userOrganization.contractAwarderPersona?.id,
      supplierPersonaId: userOrganization.supplierPersona?.id,
      factorPersonaId: userOrganization.factorPersona?.id,
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
        contractAwarderPersona: true,
        supplierPersona: true,
        factorPersona: true,
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
      factorPersona: new FactorPersona(),
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
          contractAwarderPersona: true,
          supplierPersona: true,
          factorPersona: true,
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
