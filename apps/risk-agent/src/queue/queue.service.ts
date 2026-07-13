import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import {
  RiskAgentQueueItem,
  RiskAgentQueueStatusEnum,
} from '../models/risk-agent-queue-item.entity';
import { ProcessedEventRepository } from '../repositories';
import { RiskAgentService } from '../agent/risk-agent.service';
import { RiskOperationClientService } from '../tools/risk-operation-client.service';
import { DocumentRequestService } from '../document-request/document-request.service';
import { ApplicationSubmittedForReviewMessage } from './queue.controller';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectRepository(RiskAgentQueueItem)
    private readonly queueItemRepository: Repository<RiskAgentQueueItem>,
    private readonly entityManager: EntityManager,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly riskAgentService: RiskAgentService,
    private readonly riskOperationClient: RiskOperationClientService,
    private readonly documentRequestService: DocumentRequestService,
  ) {}

  async enqueueAndSelectFilter(
    message: ApplicationSubmittedForReviewMessage,
  ): Promise<void> {
    const queueItem = await this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(
        RiskAgentQueueItem,
        new RiskAgentQueueItem({
          applicationId: message.applicationId,
          applicationNumber: message.applicationNumber,
          status: RiskAgentQueueStatusEnum.NEW,
        }),
      );
      await this.processedEventRepository.record(manager, {
        id: message.eventId,
        topic: KafkaTopicEnum.APPLICATION_SUBMITTED_FOR_REVIEW,
      });
      return saved;
    });

    try {
      await this.riskAgentService.runTask({
        applicationId: message.applicationId,
        applicationNumber: message.applicationNumber,
        expectRecommendation: false,
        userMessage: `A new application (applicationId=${message.applicationId}, applicationNumber=${message.applicationNumber}) has reached PENDING_ASSIGNEE_REVIEW. Use get_application and list_risk_profiles to choose the most appropriate risk profile for its organization, product, and amount, then call change_risk_profile. Once a profile is assigned, call run_quantitative_scoring and then generate_manual_review_alerts to produce the Filter 1 result. Respond with a one-sentence summary of why you chose that profile once done.`,
      });

      await this.queueItemRepository.update(queueItem.id, {
        status: RiskAgentQueueStatusEnum.AWAITING_DOCUMENTS,
      });

      const application = await this.riskOperationClient.getApplication(
        message.applicationId,
      );
      const clientContactEmail: string | undefined =
        application?.clientContactPersons?.[0]?.person?.email ??
        application?.clientContactPersons?.[0]?.email;
      if (!clientContactEmail) {
        this.logger.warn(
          `No client contact email found on application ${message.applicationNumber} — document request email will fail to send.`,
        );
      }

      await this.documentRequestService.requestDocumentsAndStartSla({
        applicationId: message.applicationId,
        applicationNumber: message.applicationNumber,
        clientPersonaId: message.clientPersonaId,
        clientContactEmail: clientContactEmail ?? 'unknown@unknown.invalid',
      });

      // Financial credit report data already exists by this point (created
      // synchronously in submitApplicationForReview), so the Filter 1
      // evaluation doesn't need to wait on the document request above —
      // that SLA workflow is a parallel verification track, not a gate on
      // the quantitative score the agent just computed.
      const outcome = await this.riskAgentService.runTask({
        applicationId: message.applicationId,
        applicationNumber: message.applicationNumber,
        expectRecommendation: true,
        userMessage: `Evaluate the Filter 1 (quantitative) result for application ${message.applicationNumber}. Use get_risk_application_scoring and get_manual_review_alerts to review the score, category, and any threshold-breach alerts, then call propose_recommendation with filterStage=FILTER_1.`,
      });

      await this.queueItemRepository.update(queueItem.id, {
        status: outcome
          ? RiskAgentQueueStatusEnum.FILTER_1_RECOMMENDED
          : RiskAgentQueueStatusEnum.AWAITING_DOCUMENTS,
      });
    } catch (error) {
      this.logger.error(
        `Filter selection failed for ${message.applicationNumber}: ${error}`,
      );
    }
  }
}
