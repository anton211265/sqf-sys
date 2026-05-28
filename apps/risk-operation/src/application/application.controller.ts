import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { CheckPolicies } from '@app/common/decorators/check-policies.decorator';
import { UserContext } from '@app/common/decorators/user-context.decorator';
import { AuthGuard } from '@app/common/guards/auth/auth.guard';
import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import { AppActions } from '@app/common/modules/casl/casl-ability.factory';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Application } from '../models';
import { ApplicationService } from './application.service';
import {
  AssignApplicationBodyDto,
  AssignApplicationParamDto,
} from './dtos/assign-application.dto';
import {
  AssigneeReviewApplicationEFormBodyDto,
  AssigneeReviewApplicationEFormParamDto,
} from './dtos/assignee-review-application-eform.dto';
import { CreateApplicationBodyDto } from './dtos/create-application.dto';
import {
  GetApplicationByIdParamDto,
  GetApplicationByIdQueryDto,
} from './dtos/get-application-by-id.dto';
import { GetApplicationsQueryDto } from './dtos/get-applications.dto';

@Controller('application')
@ApiBearerAuth('id-token')
export class ApplicationController {
  constructor(
    @Inject(DependencyInjectionTokenEnum.KAFKA_PRODUCER)
    private readonly kafkaProducer: ClientKafka,
    private readonly applicationService: ApplicationService,
  ) {}

  @ApiQuery({
    name: 'includeFacilities',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeClientAwarderContract',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'clientOrganizationName',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @CheckPolicies((ability) => ability.can(AppActions.Read, new Application()))
  @Get()
  async getApplications(
    @Query()
    query: GetApplicationsQueryDto,
  ) {
    return await this.applicationService.getApplications({
      clientOrganizationName: query.clientOrganizationName,
      pageSize: query.pageSize,
      pageNumber: query.pageNumber,
      includeClientAwarderContract: {
        value: query.includeClientAwarderContract,
      },
      includeFacilities: {
        value: query.includeFacilities,
      },
    });
  }

  @ApiQuery({
    name: 'includeFacilities',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeClientAwarderContract',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'clientOrganizationName',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @Get('/me')
  async getMyApplications(
    @Query()
    query: GetApplicationsQueryDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.applicationService.getMyApplications(
      {
        clientOrganizationName: query.clientOrganizationName,
        pageSize: query.pageSize,
        pageNumber: query.pageNumber,
        includeClientAwarderContract: {
          value: query.includeClientAwarderContract,
        },
        includeFacilities: {
          value: query.includeFacilities,
        },
      },
      userContext,
    );
  }

  @ApiQuery({
    name: 'includeApplicationSupportingDocuments',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeFacilities',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeAssigneePerson',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeCreatorPerson',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeFactorOrganization',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeClientAwarderContract',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeClientOrganization',
    required: false,
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Get('/:id')
  async getApplicationById(
    @Param()
    param: GetApplicationByIdParamDto,
    @Query()
    query: GetApplicationByIdQueryDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.applicationService.getApplicationById(
      param.id,
      {
        includeClientOrganization: {
          value: query.includeClientOrganization,
        },
        includeClientAwarderContract: {
          value: query.includeClientAwarderContract,
        },
        includeFactorOrganization: {
          value: query.includeFactorOrganization,
        },
        includeCreatorPerson: {
          value: query.includeCreatorPerson,
        },
        includeAssigneePerson: {
          value: query.includeAssigneePerson,
        },
        includeFacilities: {
          value: query.includeFacilities,
        },
        includeApplicationSupportingDocuments: {
          value: query.includeApplicationSupportingDocuments,
        },
      },
      userContext,
    );
  }

  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @CheckPolicies((ability) =>
    ability.can(AppActions.Update, new Application(), 'assigneePersonId'),
  )
  @Post('/:id/assign')
  async assignApplication(
    @Param() param: AssignApplicationParamDto,
    @Body() body: AssignApplicationBodyDto,
  ) {
    return await this.applicationService.assignApplication(
      param.id,
      body.assigneePersonId,
    );
  }

  @UseGuards(AuthGuard)
  @CheckPolicies((ability) => ability.can(AppActions.Create, new Application()))
  @Post()
  async createApplication(
    @Body() body: CreateApplicationBodyDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.applicationService.createApplication(body, userContext);
  }

  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Post('/:id/assignee-review-application-eform')
  async assigneeReviewApplicationEForm(
    @Param()
    param: AssigneeReviewApplicationEFormParamDto,
    @Body() body: AssigneeReviewApplicationEFormBodyDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.applicationService.assigneeReviewApplicationEForm(
      param.id,
      body,
      userContext,
    );
  }
}
