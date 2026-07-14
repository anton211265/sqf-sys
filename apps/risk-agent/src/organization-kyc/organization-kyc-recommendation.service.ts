import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationKycRecommendation } from '../models/organization-kyc-recommendation.entity';
import { RiskAgentHumanOutcomeEnum } from '../models/risk-agent-recommendation.entity';

@Injectable()
export class OrganizationKycRecommendationService {
  constructor(
    @InjectRepository(OrganizationKycRecommendation)
    private readonly organizationKycRecommendationRepository: Repository<OrganizationKycRecommendation>,
  ) {}

  async list() {
    return this.organizationKycRecommendationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getForOrganization(organizationId: number) {
    return this.organizationKycRecommendationRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async resolve(
    id: number,
    dto: {
      outcome: RiskAgentHumanOutcomeEnum;
      humanActorId: number;
      humanNote?: string;
    },
  ) {
    const recommendation = await this.organizationKycRecommendationRepository.findOne({
      where: { id },
    });
    if (!recommendation) {
      throw new NotFoundException(`No organization KYC recommendation with id ${id}`);
    }
    await this.organizationKycRecommendationRepository.update(id, {
      humanOutcome: dto.outcome,
      humanActorId: dto.humanActorId,
      humanNote: dto.humanNote ?? null,
      resolvedAt: new Date(),
    });
    return this.organizationKycRecommendationRepository.findOne({ where: { id } });
  }
}
