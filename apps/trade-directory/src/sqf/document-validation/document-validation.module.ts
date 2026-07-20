import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { Organization } from '../../models/organization.entity';
import { OrganizationPerson } from '../../models/organization-person.entity';
import { Person } from '../../models/person.entity';
import { OutboxEventRepository, ProcessedEventRepository } from '../../repositories';
import { DocumentValidationController } from './document-validation.controller';
import { DocumentValidationService } from './document-validation.service';

// Phase 4 of the document-management redesign: supplies trade-directory's
// stored organization snapshot for COMPANY_REGISTRY cross-validation.
@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      Organization,
      OrganizationPerson,
      Person,
      OutboxEvent,
      ProcessedEvent,
    ]),
  ],
  controllers: [DocumentValidationController],
  providers: [
    DocumentValidationService,
    OutboxEventRepository,
    ProcessedEventRepository,
  ],
})
export class DocumentValidationModule {}
