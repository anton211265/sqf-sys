import {
  ApplicationPublicGrpcServiceController,
  ApplicationPublicGrpcServiceControllerMethods,
  ValidateDto,
  ValidateResponse,
} from '@app/common/apps/risk-operation/proto/application-public';
import { ReceiveExperianReportMessage } from '@app/common/apps/trade-directory/types/kafka-message.type';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ApplicationPublicContext } from '@app/common/decorators/application-public-context.decorator';
import { UserContext } from '@app/common/decorators/user-context.decorator';
import { ApplicationPublicGuardResponseDto } from '@app/common/guards/application-public/dtos/application-public-guard-response.dto';
import { AuthGuard } from '@app/common/guards/auth/auth.guard';
import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka, EventPattern } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApplicationPublicService } from './application-public.service';
import { ApplicationPublicGuard } from './applicaton-public.guard';
import { ApplicationPublicParamDto } from './dtos/application-public-param.dto';
import { ClientSubmitApplicationEFormBodyDto } from './dtos/client-submit-application-eform.dto';
import { CreateApplicationPublicParamDto } from './dtos/create-application-public.dto';
import { GrantExperianConsentBodyDto } from './dtos/grant-experian-consent.dto';
import { RequestClientConsentParamDto } from './dtos/request-client-consent.dto';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';

@Controller('application-public')
@ApplicationPublicGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class ApplicationPublicController
  implements ApplicationPublicGrpcServiceController, OnModuleInit
{
  constructor(
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
    private readonly applicationPublicService: ApplicationPublicService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    createTopics(
      this.configService.get('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
  }

  async validateGrpc(request: ValidateDto): Promise<ValidateResponse> {
    return await this.applicationPublicService.validate(
      request.applicationPublicUuid,
    );
  }

  @ApiParam({
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @Get('/:applicationPublicUuid')
  async validate(@Param() param: ApplicationPublicParamDto) {
    return await this.applicationPublicService.validate(
      param.applicationPublicUuid,
    );
  }

  @ApiParam({
    name: 'applicationId',
    required: true,
    type: String,
  })
  @UseGuards(AuthGuard)
  @Post('/request-client-consent/:applicationId')
  async requestClientConsent(
    @Param() param: RequestClientConsentParamDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.applicationPublicService.requestClientConsent(
      param.applicationId,
      userContext,
    );
  }

  @ApiParam({
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Post('/:applicationPublicUuid/grant-experian-consent')
  async grantExperianConsent(
    @Body() body: GrantExperianConsentBodyDto,
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    return await this.applicationPublicService.grantExperianConsent(
      body,
      applicationPublicContext,
    );
  }

  @EventPattern(KafkaTopicEnum.RECEIVE_EXPERIAN_REPORT)
  async onReceiveExperianReport(@Body() body: ReceiveExperianReportMessage) {
    return await this.applicationPublicService.onReceiveExperianReport(body);
  }

  @ApiParam({
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Post('/:applicationPublicUuid/application-supporting-document')
  async presignedUploadApplicationSupportingDocument(
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    return await this.applicationPublicService.presignedUploadApplicationSupportingDocument(
      applicationPublicContext,
    );
  }

  @ApiParam({
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Post('/:applicationPublicUuid/client-submit-application-eform')
  async clientSubmitApplicationEForm(
    @Body() body: ClientSubmitApplicationEFormBodyDto,
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    return await this.applicationPublicService.clientSubmitApplicationEForm(
      body,
      applicationPublicContext,
    );
  }

  @ApiParam({
    name: 'applicationId',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Post('/:applicationId')
  async createApplicationPublic(
    @Param() param: CreateApplicationPublicParamDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.applicationPublicService.createApplicationPublic(
      param.applicationId,
      userContext,
    );
  }
}
