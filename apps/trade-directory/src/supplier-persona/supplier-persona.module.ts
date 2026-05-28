import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { Organization, SupplierPersona } from '../models';
import {
  OrganizationRepository,
  SupplierPersonaRepository,
} from '../repositories';
import { SupplierPersonaController } from './supplier-persona.controller';
import { SupplierPersonaService } from './supplier-persona.service';

@Module({
  imports: [DatabaseModule.forFeature([SupplierPersona, Organization])],
  controllers: [SupplierPersonaController],
  providers: [
    SupplierPersonaService,
    SupplierPersonaRepository,
    OrganizationRepository,
  ],
})
export class SupplierPersonaModule {}
