import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import {
  FunderPersona,
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  Person,
} from '../models';
import {
  FunderPersonaRepository,
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { AuthModule } from '../auth/auth.module';
import { SystemSetupController } from './system-setup.controller';
import { SystemSetupGuard } from './system-setup.guard';
import { SystemSetupService } from './system-setup.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Organization,
      FunderPersona,
      Person,
      OrganizationPerson,
      OrganizationPersonRole,
    ]),
    AuthModule,
  ],
  controllers: [SystemSetupController],
  providers: [
    SystemSetupService,
    SystemSetupGuard,
    OrganizationRepository,
    FunderPersonaRepository,
    PersonRepository,
    OrganizationPersonRepository,
  ],
})
export class SystemSetupModule {}
