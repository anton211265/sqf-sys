import {
  EmailGrpcServiceController,
  EmailGrpcServiceControllerMethods,
  SendEmailDto,
} from '@app/common/apps/notification/proto/email';
import { SendEmailMessage } from '@app/common/apps/notification/types/kafka-message.type';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Body, Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import createTopics from 'libs/common/kafka/createTopics';
import { EmailService } from './email.service';
import { ProcessedEventRepository } from './processed-event.repository';

@Controller('email')
@EmailGrpcServiceControllerMethods()
export class EmailController implements EmailGrpcServiceController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
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
    if (await this.processedEventRepository.exists(body.eventId)) {
      this.logger.warn(
        `Skipping already-processed SEND_EMAIL event: ${body.eventId}`,
      );
      return;
    }
    await this.emailService.sendEmail(body);
    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: body.eventId,
        topic: KafkaTopicEnum.SEND_EMAIL,
      });
    });
  }
}
