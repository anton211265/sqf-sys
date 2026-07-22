import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { AuthAuditLog } from '../models/auth-audit-log.entity';
import { AuthAuditLogRepository } from '../repositories/auth-audit-log.repository';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { z } from 'zod';
import {
  EnrollmentToken,
  Organization,
  OrganizationPerson,
  Person,
  WebauthnCredential,
} from '../models';
import {
  EnrollmentTokenRepository,
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
  WebauthnCredentialRepository,
} from '../repositories';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Token } from '../models/token.entity';
import { TokenRepository } from '../repositories/token.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BearerContextGuard } from './guards/bearer-context.guard';
import { PasskeyController, QrLoginController } from './passkey/passkey.controller';
import { PasskeyService } from './passkey/passkey.service';
import { QrLoginService } from './passkey/qr-login.service';

@Global()
@Module({
  imports: [
    DatabaseModule.forFeature([
      Organization,
      Person,
      Token,
      OrganizationPerson,
      OutboxEvent,
      AuthAuditLog,
      WebauthnCredential,
      EnrollmentToken,
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            ROOT_DIR: z.string(),
            PORT: z.coerce.number(),
          })
          .parse(config);
      },
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.getOrThrow('JWT_EXPIRATION')}s`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, PasskeyController, QrLoginController],
  providers: [
    AuthService,
    PasskeyService,
    QrLoginService,
    BearerContextGuard,
    OrganizationRepository,
    PersonRepository,
    OrganizationPersonRepository,
    TokenRepository,
    WebauthnCredentialRepository,
    EnrollmentTokenRepository,
    OutboxEventRepository,
    AuthAuditLogRepository,
    JwtStrategy,
  ],
  exports: [AuthService, PasskeyService, QrLoginService, JwtModule],
})
export class AuthModule {}
