import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { ClientAssignee } from '../models';
import { ClientAssigneeRepository } from '../repositories';
import { ClientAssigneeController } from './client-assignee.controller';
import { ClientAssigneeService } from './client-assignee.service';

@Module({
  imports: [
    DatabaseModule.forFeature([ClientAssignee]),
    ClientsModule.registerAsync([
      {
        name: DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: `${configService.getOrThrow('TRADE_DIRECTORY_URL')}:5000`,
            package: 'trade_directory',
            protoPath: path.resolve(
              configService.getOrThrow('ROOT_DIR'),
              './apps/trade-directory/proto/main.proto',
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
  ],
  controllers: [ClientAssigneeController],
  providers: [ClientAssigneeService, ClientAssigneeRepository],
})
export class ClientAssigneeModule {}
