import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
} from '@nestjs/common';
import { ApplicationPersonService } from './application-person.service';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { ClientKafka, EventPattern } from '@nestjs/microservices';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { CreateApplicationPersonKafkaMessageType } from '@app/common/apps/trade-directory/types/kafka-message.type';

@Controller('application-person')
export class ApplicationPersonController {
  constructor(
    private readonly applicationPersonService: ApplicationPersonService,
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
  ) {}

  // @EventPattern(KafkaTopicEnum.SQF_CREATE_APPLICATION_PERSON)
  // async handleCreateNewApplicationPerson(
  //   message: CreateApplicationPersonKafkaMessageType,
  // ): Promise<void> {
  //

  //   await this.applicationPersonService.handleCreateNewApplicationPerson({
  //     ...message,
  //   });
  // }
}
