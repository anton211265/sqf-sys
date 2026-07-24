import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Contract } from '../models/contract.entity';
import { OperationsCase } from '../models/operations-case.entity';
import { Organization } from '../models/organization.entity';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { RbacModule } from '../rbac/rbac.module';
import { OperationsController, PortalAgreementController } from './operations.controller';
import { OperationsService } from './operations.service';

/** Operations Hub pass 1 (2026-07-24): Product Approval stage. */
@Module({
  imports: [
    DatabaseModule.forFeature([OperationsCase, Contract, Organization, OutboxEvent]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    RbacModule,
  ],
  controllers: [OperationsController, PortalAgreementController],
  providers: [OperationsService, OutboxEventRepository],
  exports: [OperationsService],
})
export class OperationsModule {}
