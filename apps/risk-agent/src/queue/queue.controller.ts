import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Controller } from '@nestjs/common';
import { Payload, EventPattern } from '@nestjs/microservices';
import { ProcessedEventRepository } from '../repositories';
import { QueueService } from './queue.service';

export interface ApplicationSubmittedForReviewMessage {
  eventId: string;
  applicationId: number;
  applicationNumber: string;
  clientPersonaId: number;
}

@Controller()
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly processedEventRepository: ProcessedEventRepository,
  ) {}

  @EventPattern(KafkaTopicEnum.APPLICATION_SUBMITTED_FOR_REVIEW)
  async handleApplicationSubmittedForReview(
    @Payload() body: ApplicationSubmittedForReviewMessage,
  ) {
    if (await this.processedEventRepository.exists(body.eventId)) {
      return;
    }
    await this.queueService.enqueueAndSelectFilter(body);
  }
}
