import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { APIKeyStrategy } from './strategies/api-key.strategy';
import { AUTH_SERVICE } from './auth.interface';
import { AuthService } from './auth.service';
import { ApiKeyRepository } from '../../repositories/api-key.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { ApiKey } from '../../models/api-key.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([ApiKey]),
    PassportModule,
    ClientsModule.registerAsync([
      {
        name: TRADE_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: TRADE_SERVICE,
              brokers: configService.getOrThrow('KAFKA_BROKERS').split(','),
              ssl: configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
            },
            consumer: {
              groupId: 'auth-consumer-document-management-auth',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
    APIKeyStrategy,
    ApiKeyRepository,
  ],
})
export class AuthModule {}
