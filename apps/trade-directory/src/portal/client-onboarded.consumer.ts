import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Organization } from '../models/organization.entity';
import { ProcessedEventRepository } from '../repositories/processed-event.repository';
import { OperationsService } from '../operations/operations.service';

/**
 * Customer Portal pass 2: CLIENT_ONBOARDED (registration fee confirmed
 * after ILO acceptance) — the applicant organization becomes a non-active
 * Client: fullyOnboardedAt is stamped here, in the service that owns the
 * organization record. Idempotent; poison messages dropped.
 */
@Controller()
export class ClientOnboardedConsumer {
  private readonly logger = new Logger(ClientOnboardedConsumer.name);

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly operationsService: OperationsService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.CLIENT_ONBOARDED)
  async handle(@Payload() event: any): Promise<void> {
    try {
      if (!event?.eventId || !Number.isInteger(event?.organizationId)) {
        this.logger.warn('Dropping malformed CLIENT_ONBOARDED event');
        return;
      }
      if (await this.processedEventRepository.exists(event.eventId)) return;
      const organization = await this.organizationRepository.findOne({
        where: { id: event.organizationId },
      });
      if (organization && !organization.fullyOnboardedAt) {
        organization.fullyOnboardedAt = new Date();
        await this.organizationRepository.save(organization);
        this.logger.log(
          `Organization ${organization.id} (${organization.organizationName}) is now a non-active client`,
        );
      }
      // Operations Hub: the onboarded client queues for the Product
      // Approval stage (agreement pack -> client signature -> facility).
      await this.operationsService.createCaseFromOnboarding(event);
      await this.entityManager.transaction(async (manager) => {
        await this.processedEventRepository.record(manager, {
          id: event.eventId,
          topic: KafkaTopicEnum.CLIENT_ONBOARDED,
        });
      });
    } catch (error) {
      this.logger.error(`CLIENT_ONBOARDED handling failed (dropped): ${(error as Error).message}`);
    }
  }
}
