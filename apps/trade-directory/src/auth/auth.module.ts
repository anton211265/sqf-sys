import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { AuthAuditLog } from '../models/auth-audit-log.entity';
import { AuthAuditLogRepository } from '../repositories/auth-audit-log.repository';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { z } from 'zod';
import {
  Organization,
  OrganizationPerson,
  Person,
  ResetPasswordToken,
} from '../models';
import {
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Token } from '../models/token.entity';
import { TokenRepository } from '../repositories/token.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ResetPasswordTokenRepository } from '../repositories/reset-password-token.repository';

@Global()
@Module({
  imports: [
    DatabaseModule.forFeature([
      Organization,
      Person,
      Token,
      OrganizationPerson,
      ResetPasswordToken,
      OutboxEvent,
      AuthAuditLog,
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
  controllers: [AuthController],
  providers: [
    AuthService,
    OrganizationRepository,
    PersonRepository,
    OrganizationPersonRepository,
    TokenRepository,
    ResetPasswordTokenRepository,
    OutboxEventRepository,
    AuthAuditLogRepository,
    JwtStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
