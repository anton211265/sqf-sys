import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { ContractAwarderPersona, Organization } from '../models';
import {
  ContractAwarderPersonaRepository,
  OrganizationRepository,
} from '../repositories';
import { ContractAwarderPersonaController } from './contract-awarder-persona.controller';
import { ContractAwarderPersonaService } from './contract-awarder-persona.service';

@Module({
  imports: [DatabaseModule.forFeature([ContractAwarderPersona, Organization])],
  controllers: [ContractAwarderPersonaController],
  providers: [
    ContractAwarderPersonaService,
    ContractAwarderPersonaRepository,
    OrganizationRepository,
  ],
})
export class ContractAwarderPersonaModule {}
