import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import { Contract, Organization, Relationship } from '../models';
import {
  ContractRepository,
  OrganizationRepository,
  OutboxEventRepository,
} from '../repositories';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';

@Module({
  imports: [
    DatabaseModule.forFeature([Contract, Relationship, Organization, OutboxEvent]),
  ],
  controllers: [ContractController],
  providers: [
    ContractService,
    ContractRepository,
    OrganizationRepository,
    OutboxEventRepository,
  ],
  exports: [ContractService],
})
export class ContractModule {}
