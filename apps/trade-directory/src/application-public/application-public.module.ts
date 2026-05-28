import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { ExperianModule } from '../experian/experian.module';
import { OrganizationPersonModule } from '../organization-person/organization-person.module';
import { OrganizationModule } from '../organization/organization.module';
import { ApplicationPublicController } from './application-public.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.RISK_OPERATION_GRPC_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: `${configService.getOrThrow('RISK_OPERATION_URL')}:5000`,
            package: 'risk_operation',
            protoPath: path.resolve(
              configService.getOrThrow('ROOT_DIR'),
              './apps/risk-operation/proto/main.proto',
            ),
            loader: {
              arrays: true,
              enums: String,
              includeDirs: [
                path.resolve(configService.getOrThrow('ROOT_DIR'), './apps'),
              ],
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    OrganizationModule,
    OrganizationPersonModule,
    BankAccountModule,
    ExperianModule,
  ],
  controllers: [ApplicationPublicController],
  providers: [],
})
export class ApplicationPublicModule {}
