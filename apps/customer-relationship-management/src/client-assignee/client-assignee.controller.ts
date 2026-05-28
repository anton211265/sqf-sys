import { CreateClientAssigneeMessage } from '@app/common/apps/customer-relationship-management/types/kafka-message.type';
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
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClientAssignee } from '../models';
import { ClientAssigneeService } from './client-assignee.service';
import {
  AssignClientAssigneeBodyDto,
  AssignClientAssigneeParamDto,
} from './dtos/assign-client-assignee.dto';
import { GetClientAssigneesQueryDto } from './dtos/get-client-assignees.dto';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';

@Controller('client-assignee')
@ApiBearerAuth('id-token')
export class ClientAssigneeController {
  constructor(
    private readonly clientAssigneeService: ClientAssigneeService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    createTopics(
      this.configService.get('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
  }

  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'clientOrganizationName',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @CheckPolicies((ability) =>
    ability.can(AppActions.Read, new ClientAssignee()),
  )
  @Get()
  async getClientAssignees(
    @Query()
    query: GetClientAssigneesQueryDto,
  ) {
    return await this.clientAssigneeService.getClientAssignees(query);
  }

  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'clientOrganizationName',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @Get('/me')
  async getMyClientAssignees(
    @Query()
    query: GetClientAssigneesQueryDto,
    @UserContext() userContext: AuthResponseDto,
  ) {
    return await this.clientAssigneeService.getMyClientAssignees(
      query,
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
    ability.can(AppActions.Update, new ClientAssignee(), 'assigneePersonId'),
  )
  @Post('/:id/assign')
  async assignApplication(
    @Param() param: AssignClientAssigneeParamDto,
    @Body() body: AssignClientAssigneeBodyDto,
  ) {
    return await this.clientAssigneeService.assignClientAssignee(
      param.id,
      body.assigneePersonId,
    );
  }

  @EventPattern(KafkaTopicEnum.CREATE_CLIENT_ASSIGNEE)
  async createClientAssigneeEvent(@Body() body: CreateClientAssigneeMessage) {
    return await this.clientAssigneeService.createClientAssigneeEvent(body);
  }
}
