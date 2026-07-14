import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Controller } from '@nestjs/common';
import { Payload, EventPattern } from '@nestjs/microservices';
import { ProcessedEventRepository } from '../repositories';
import { OrganizationKycService } from './organization-kyc.service';

export interface OrganizationCreatedMessage {
  eventId: string;
  organizationId: number;
  organizationName: string;
  businessRegistrationNumber: string | null;
  country: string;
  source: 'invoice_issuer' | 'invoice_debtor';
  funderPersonaId: number;
}

@Controller()
export class OrganizationKycController {
  constructor(
    private readonly organizationKycService: OrganizationKycService,
    private readonly processedEventRepository: ProcessedEventRepository,
  ) {}

  @EventPattern(KafkaTopicEnum.ORGANIZATION_CREATED)
  async handleOrganizationCreated(@Payload() body: OrganizationCreatedMessage) {
    if (await this.processedEventRepository.exists(body.eventId)) {
      return;
    }
    await this.organizationKycService.runKycCheck(body);
  }
}
