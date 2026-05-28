import { RequestExperianReportMessage } from '@app/common/apps/trade-directory/types/kafka-message.type';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Body, Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ExperianService } from './experian.service';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';

@Controller('experian')
export class ExperianController {
  constructor(
    private readonly experianService: ExperianService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    createTopics(
      this.configService.get('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
  }

  @EventPattern(KafkaTopicEnum.REQUEST_EXPERIAN_REPORT)
  async requestExperianReport(@Body() body: RequestExperianReportMessage) {
    await this.experianService.requestExperianReport(body);
  }
}
