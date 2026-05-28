import {
  EmailGrpcServiceController,
  EmailGrpcServiceControllerMethods,
  SendEmailDto,
} from '@app/common/apps/notification/proto/email';
import { SendEmailMessage } from '@app/common/apps/notification/types/kafka-message.type';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Body, Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';

@Controller('email')
@EmailGrpcServiceControllerMethods()
export class EmailController implements EmailGrpcServiceController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    createTopics(
      this.configService.get('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
  }

  async sendEmailGrpc(payload: SendEmailDto): Promise<void> {
    return await this.emailService.sendEmail(payload);
  }

  @EventPattern(KafkaTopicEnum.SEND_EMAIL)
  async sendEmail(@Body() body: SendEmailMessage) {
    await this.emailService.sendEmail(body);
  }
}
