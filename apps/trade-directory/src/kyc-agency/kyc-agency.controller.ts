import { RequestKycReportMessage } from '@app/common/apps/trade-directory/types/kafka-message.type';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Body, Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { KycAgencyService } from './kyc-agency.service';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';

@Controller('kyc-agency')
export class KycAgencyController {
  constructor(
    private readonly kycAgencyService: KycAgencyService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    createTopics(
      this.configService.get('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
  }

  @EventPattern(KafkaTopicEnum.REQUEST_KYC_REPORT)
  async requestKycReport(@Body() body: RequestKycReportMessage) {
    await this.kycAgencyService.requestKycReport(body);
  }
}
