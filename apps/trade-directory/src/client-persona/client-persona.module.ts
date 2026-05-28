import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { ClientPersona, Organization } from '../models';
import {
  ClientPersonaRepository,
  OrganizationRepository,
} from '../repositories';
import { ClientPersonaController } from './client-persona.controller';
import { ClientPersonaService } from './client-persona.service';

@Module({
  imports: [DatabaseModule.forFeature([ClientPersona, Organization])],
  controllers: [ClientPersonaController],
  providers: [
    ClientPersonaService,
    ClientPersonaRepository,
    OrganizationRepository,
  ],
})
export class ClientPersonaModule {}
