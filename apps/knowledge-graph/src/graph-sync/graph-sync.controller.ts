import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Body, Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { GraphSyncService } from './graph-sync.service';

@Controller()
export class GraphSyncController {
  constructor(private readonly graphSyncService: GraphSyncService) {}

  @EventPattern(KafkaTopicEnum.RELATIONSHIP_UPSERTED)
  async onRelationshipUpserted(@Body() payload: Record<string, any>) {
    await this.graphSyncService.upsertRelationship(payload);
  }

  @EventPattern(KafkaTopicEnum.CONTRACT_UPSERTED)
  async onContractUpserted(@Body() payload: Record<string, any>) {
    await this.graphSyncService.upsertContract(payload);
  }

  @EventPattern(KafkaTopicEnum.INVOICE_STATUS_CHANGED)
  async onInvoiceStatusChanged(@Body() payload: Record<string, any>) {
    await this.graphSyncService.upsertInvoice(payload);
  }
}
