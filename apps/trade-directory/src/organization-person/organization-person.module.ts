import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { Organization, OrganizationPerson, Person } from '../models';
import {
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { OrganizationPersonController } from './organization-person.controller';
import { OrganizationPersonService } from './organization-person.service';

@Module({
  imports: [
    DatabaseModule.forFeature([OrganizationPerson, Organization, Person]),
  ],
  controllers: [OrganizationPersonController],
  providers: [
    OrganizationPersonService,
    OrganizationPersonRepository,
    OrganizationRepository,
    PersonRepository,
  ],
  exports: [OrganizationPersonService],
})
export class OrganizationPersonModule {}
