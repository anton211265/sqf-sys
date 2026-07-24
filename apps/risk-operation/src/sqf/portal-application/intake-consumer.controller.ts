import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import {
  PortalApplicationService,
  RM_ENGAGEMENT_SLA_CODE,
} from './portal-application.service';
import { OFFER_ACCEPTANCE_SLA_CODE, OffersService } from '../offers/offers.service';

interface SlaBreachedEvent {
  eventId: string;
  funderOrganizationId: number;
  slaCode: string;
  subjectType: string;
  subjectId: string;
}

/**
 * First SLA_BREACHED consumer (Customer Portal pass 1): when the RM's
 * 10-working-day engagement window on a Filter-1 FAIL lapses, the
 * application closes and is archived (blueprint §1). Idempotent via
 * processed_event; unknown slaCodes/subjects are ignored — other services
 * consume their own breaches from the same topic.
 */
@Controller()
export class IntakeConsumerController {
  private readonly logger = new Logger(IntakeConsumerController.name);

  constructor(
    private readonly portalApplicationService: PortalApplicationService,
    private readonly offersService: OffersService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.SLA_BREACHED)
  async handleSlaBreached(@Payload() event: SlaBreachedEvent): Promise<void> {
    // Poison messages are logged and dropped — never wedge the consumer
    // group (same rule as the SLA engine's own consumers). processed_event
    // ids are uuids, so a malformed eventId is also a drop.
    try {
      // Single SLA_BREACHED handler per app (Nest allows one EventPattern
      // per topic) — dispatch by slaCode: the RM engagement window closes
      // failed applications; the acceptance window lapses SENT offers.
      const isEngagement = event?.slaCode === RM_ENGAGEMENT_SLA_CODE && event?.subjectType === 'APPLICATION';
      const isAcceptance = event?.slaCode === OFFER_ACCEPTANCE_SLA_CODE && event?.subjectType === 'OFFER';
      if (!isEngagement && !isAcceptance) {
        return;
      }
      if (!/^[0-9a-f-]{36}$/i.test(event?.eventId ?? '')) {
        this.logger.warn(`Dropping SLA_BREACHED with malformed eventId: ${event?.eventId}`);
        return;
      }
      if (await this.processedEventRepository.exists(event.eventId)) return;
      const subjectId = parseInt(event.subjectId, 10);
      if (Number.isInteger(subjectId)) {
        if (isEngagement) await this.portalApplicationService.closeOnEngagementBreach(subjectId);
        else await this.offersService.onAcceptanceBreach(subjectId);
      }
      await this.entityManager.transaction(async (manager) => {
        await this.processedEventRepository.record(manager, {
          id: event.eventId,
          topic: KafkaTopicEnum.SLA_BREACHED,
        });
      });
      this.logger.log(`RM engagement breach processed for application ${event.subjectId}`);
    } catch (error) {
      this.logger.error(
        `SLA_BREACHED handling failed (dropped): ${(error as Error).message}`,
      );
    }
  }
}
