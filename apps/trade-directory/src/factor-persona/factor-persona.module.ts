import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { FactorPersona, Organization } from '../models';
import {
  FactorPersonaRepository,
  OrganizationRepository,
} from '../repositories';
import { FactorPersonaController } from './factor-persona.controller';
import { FactorPersonaService } from './factor-persona.service';

@Module({
  imports: [DatabaseModule.forFeature([FactorPersona, Organization])],
  controllers: [FactorPersonaController],
  providers: [
    FactorPersonaService,
    FactorPersonaRepository,
    OrganizationRepository,
  ],
})
export class FactorPersonaModule {}
