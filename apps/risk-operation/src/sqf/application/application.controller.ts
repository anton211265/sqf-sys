import {
  Controller,
  Post,
  Body,
  Inject,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { UpdateRepresentativeDetailsDto } from './dto/update-representative-details.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Application } from '../../models';
import { ApiQuery } from '@nestjs/swagger';
import { GetApplicationsByOrgIdWithFilteringDto } from './dto/get-application-by-id.dto';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';

@Controller('/api/applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
  ) {}

  // --------------- Create new application ---------------
  @Post()
  createNewApplication(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationService.createNewApplication(createApplicationDto);
  }

  // --------------- Onboarding: Update Representative Details ---------------
  @Post(':id/representative')
  @HttpCode(HttpStatus.OK) // Enforce a 200 response code
  updateRepresentativeDetails(
    @Param('id') id: number,
    @Body() requestBody: UpdateRepresentativeDetailsDto,
  ) {
    return this.applicationService.updateRepresentativeDetails(id, requestBody);
  }

  // --------------- Onboarding: Submit application for review ---------------
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK) // Enforce a 200 response code
  submitApplicationForReview(@Param('id') id: number) {
    return this.applicationService.submitApplicationForReview(id);
  }

  @Get('latest')
  async getLatestApplication(): Promise<Application | null> {
    return await this.applicationService.getLatestApplication();
  }

  // --------------- Get Applications by OrgID with Filtering ---------------
  @MessagePattern(KafkaTopicEnum.SQF_GET_APPLICATIONS_BY_ORG_ID)
  async getApplicationsByOrgIdKafka(organizationId: number) {
    console.log(
      `🔹 Received Kafka SQF_GET_APPLICATIONS_BY_ORG_ID message request for organizationId: ${organizationId}`,
    );

    const applications =
      await this.applicationService.getApplicationsbyOrgIdEvent(organizationId);

    console.log('Kafka SQF_GET_APPLICATIONS_BY_ORG_ID response:', applications);

    return applications;
  }

  @MessagePattern(KafkaTopicEnum.SQF_GET_ALL_APPLICATIONS)
  async getAllApplicationsEvent() {
    console.log('Triggered Kafka event: SQF_GET_ALL_APPLICATIONS');

    const applications =
      await this.applicationService.getAllApplicationsEvent();

    console.log('Kafka SQF_GET_ALL_APPLICATIONS response:', applications);

    return applications;
  }
}
