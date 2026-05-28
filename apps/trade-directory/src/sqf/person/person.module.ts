import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/common/database/database.module';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { Person } from '../../models';
import { PersonRepository } from '../../repositories';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';

@Module({
  imports: [
    DatabaseModule.forFeature([Person]),
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
              groupId: 'auth-consumer-person-auth',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PersonController],
  providers: [PersonService, PersonRepository, JwtStrategy],
})
export class SqfPersonModule {}
