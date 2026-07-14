import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrganizationKycSourceEnum } from '../models/organization-kyc-recommendation.entity';
import { ProcessedEventRepository } from '../repositories';
import { RiskAgentService } from '../agent/risk-agent.service';
import { OrganizationCreatedMessage } from './organization-kyc.controller';

@Injectable()
export class OrganizationKycService {
  private readonly logger = new Logger(OrganizationKycService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly riskAgentService: RiskAgentService,
  ) {}

  async runKycCheck(message: OrganizationCreatedMessage): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: message.eventId,
        topic: KafkaTopicEnum.ORGANIZATION_CREATED,
      });
    });

    try {
      await this.riskAgentService.runOrganizationKycTask({
        organizationId: message.organizationId,
        organizationName: message.organizationName,
        businessRegistrationNumber: message.businessRegistrationNumber,
        country: message.country,
        source: message.source as OrganizationKycSourceEnum,
        funderPersonaId: message.funderPersonaId,
        userMessage: `A new organization was just auto-created in the trade directory with zero KYC performed: organizationId=${message.organizationId}, name="${message.organizationName}", businessRegistrationNumber=${message.businessRegistrationNumber ?? 'unknown'}, country=${message.country}, discovered as ${message.source} on a funder-issued invoice (funderPersonaId=${message.funderPersonaId}). Call check_compliance on the organization's name and get_financial_credit_report, then call propose_organization_kyc_outcome exactly once.`,
      });
    } catch (error) {
      this.logger.error(
        `Organization KYC check failed for organizationId=${message.organizationId}: ${error}`,
      );
    }
  }
}
