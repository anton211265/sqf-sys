import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskAgentQueueItem } from '../models/risk-agent-queue-item.entity';
import {
  RiskAgentHumanOutcomeEnum,
  RiskAgentRecommendation,
} from '../models/risk-agent-recommendation.entity';
import { DocumentRequest } from '../models/document-request.entity';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(RiskAgentQueueItem)
    private readonly queueItemRepository: Repository<RiskAgentQueueItem>,
    @InjectRepository(RiskAgentRecommendation)
    private readonly recommendationRepository: Repository<RiskAgentRecommendation>,
    @InjectRepository(DocumentRequest)
    private readonly documentRequestRepository: Repository<DocumentRequest>,
  ) {}

  async getQueueWithRecommendations() {
    const queueItems = await this.queueItemRepository.find({
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      queueItems.map(async (item) => {
        const recommendations = await this.recommendationRepository.find({
          where: { applicationNumber: item.applicationNumber },
          order: { createdAt: 'DESC' },
        });
        const documentRequests = await this.documentRequestRepository.find({
          where: { applicationNumber: item.applicationNumber },
          order: { createdAt: 'DESC' },
        });
        return { queueItem: item, recommendations, documentRequests };
      }),
    );
  }

  async getQueueItemDetail(applicationNumber: string) {
    const queueItem = await this.queueItemRepository.findOne({
      where: { applicationNumber },
    });
    if (!queueItem) {
      throw new NotFoundException(
        `No Risk Agent queue item for application ${applicationNumber}`,
      );
    }
    const recommendations = await this.recommendationRepository.find({
      where: { applicationNumber },
      order: { createdAt: 'DESC' },
    });
    const documentRequests = await this.documentRequestRepository.find({
      where: { applicationNumber },
      order: { createdAt: 'DESC' },
    });
    return { queueItem, recommendations, documentRequests };
  }

  async resolveRecommendation(
    id: number,
    dto: {
      outcome: RiskAgentHumanOutcomeEnum;
      humanActorId: number;
      humanNote?: string;
    },
  ) {
    const recommendation = await this.recommendationRepository.findOne({
      where: { id },
    });
    if (!recommendation) {
      throw new NotFoundException(`No recommendation with id ${id}`);
    }
    await this.recommendationRepository.update(id, {
      humanOutcome: dto.outcome,
      humanActorId: dto.humanActorId,
      humanNote: dto.humanNote ?? null,
      resolvedAt: new Date(),
    });
    return this.recommendationRepository.findOne({ where: { id } });
  }
}
