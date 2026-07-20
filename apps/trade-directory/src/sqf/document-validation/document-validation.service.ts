import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { DocumentExtractedEvent } from '@app/common/apps/common/interface/document-extracted-event.interface';
import { DocumentValidationDataEvent } from '@app/common/apps/common/interface/document-validation-data-event.interface';
import { Organization } from '../../models/organization.entity';
import { Person } from '../../models/person.entity';
import { OrganizationPerson } from '../../models/organization-person.entity';
import { OutboxEventRepository, ProcessedEventRepository } from '../../repositories';

// Answers a COMPANY_REGISTRY DOCUMENT_EXTRACTED event with a snapshot of the
// stored organization + director names. The comparison itself happens in
// document-management — this service only supplies its side of the data,
// keeping cross-service flow on Kafka (no shared DB reads).
@Injectable()
export class DocumentValidationService {
  private readonly logger = new Logger(DocumentValidationService.name);

  constructor(
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async provideValidationData(event: DocumentExtractedEvent): Promise<void> {
    const organization = await this.entityManager.findOne(Organization, {
      where: { id: event.subjectOrganizationId },
    });

    let storedDirectorNames: string[] = [];
    if (organization) {
      const rows = await this.entityManager
        .createQueryBuilder(OrganizationPerson, 'op')
        .innerJoin(Person, 'p', 'p.id = op."personId"')
        .select('p.name', 'name')
        .where('op."organizationId" = :orgId', {
          orgId: event.subjectOrganizationId,
        })
        .getRawMany();
      storedDirectorNames = rows.map((r) => r.name).filter(Boolean);
    }

    const payload: DocumentValidationDataEvent = {
      eventId: randomUUID(),
      documentUuid: event.documentUuid,
      subjectOrganizationId: event.subjectOrganizationId,
      organizationFound: !!organization,
      storedOrganization: organization
        ? {
            organizationName: organization.organizationName,
            businessRegistrationNumber:
              organization.businessRegistrationNumber ?? null,
            registeredAddress: organization.registeredAddress ?? null,
            businessAddress: organization.businessAddress ?? null,
            country: organization.country ?? null,
            incorporationDate: organization.incorporationDate
              ? organization.incorporationDate.toISOString().slice(0, 10)
              : null,
          }
        : undefined,
      storedDirectorNames: organization ? storedDirectorNames : undefined,
    };

    await this.entityManager.transaction(async (manager) => {
      await this.outboxEventRepository.record(manager, {
        id: payload.eventId,
        topic: KafkaTopicEnum.DOCUMENT_VALIDATION_DATA,
        payload: payload as unknown as Record<string, unknown>,
      });
      await this.processedEventRepository.record(manager, {
        id: event.eventId,
        topic: KafkaTopicEnum.DOCUMENT_EXTRACTED,
      });
    });

    this.logger.log(
      `Validation data for document ${event.documentUuid} (org ${event.subjectOrganizationId}, found=${!!organization}) queued`,
    );
  }
}
