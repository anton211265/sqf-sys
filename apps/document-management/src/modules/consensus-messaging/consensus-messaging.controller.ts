import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CONSENSUS_MESSAGING_SERVICE,
  IConsensusMessagingService,
} from './consensus-messaging.interface';
import { CreateTopicDto } from './dto/request/create-topic.dto';
import { CreateMessageDto } from './dto/request/create-message.dto';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';
import { IContext } from '../../middleware/contexts';
import { RequestIdResponseDto } from './dto/response/request-id-response.dto';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import {
  CreateMessageSwaggerApiDecorator,
  CreateTopicSwaggerApiDecorator,
  GetOnchainsSwaggerApiDecorator,
  GetOnchainSwaggerApiDecorator,
} from '../../decorators/swagger-api.decorator';
import { OnchainsDto } from './dto/request/onchains.dto';
import { OnchainResponseDto } from './dto/response/onchains-response.dto';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { KafkaJwtAuthGuard } from '@app/common/apps/common/guard/kafka-jwt.guard';
import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { GetMessagesDto } from './dto/request/get-messages.dto';
import { ClientKafka } from '@nestjs/microservices';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@ApiTags('Consensus Messaging')
@Controller('consensus-messaging')
export class ConsensusMessagingControlelr implements OnModuleInit {
  constructor(
    @Inject(CONSENSUS_MESSAGING_SERVICE)
    private readonly consensusMessagingService: IConsensusMessagingService,
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    createTopics(
      this.configService.getOrThrow('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
    this.authClient.subscribeToResponseOf(KafkaTopicEnum.AUTHENTICATE);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Get('message')
  async getMessages(
    @CurrentUser() user: IUserContext,
    @Query() getMessagesDto: GetMessagesDto,
  ): Promise<OnchainResponseDto[]> {
    return this.consensusMessagingService.onchains(
      user.orgId.toString(),
      getMessagesDto?.status,
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @CreateTopicSwaggerApiDecorator()
  @UseGuards(ApiKeyAuthGuard)
  @Post('topic')
  async createTopic(
    @Body() createTopicDto: CreateTopicDto,
    @Req() req: IContext,
  ): Promise<RequestIdResponseDto> {
    const { eventName, attributes, refId } = createTopicDto;
    const orgId = req.user.orgId;

    return await this.consensusMessagingService.createTopicWithMessage(
      orgId,
      refId,
      eventName,
      attributes,
      false,
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @CreateMessageSwaggerApiDecorator()
  @UseGuards(ApiKeyAuthGuard)
  @Post(':topicId/message')
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: IContext,
    @Param('topicId') topicId: string,
  ): Promise<RequestIdResponseDto> {
    const { eventName, attributes, refId } = createMessageDto;
    const orgId = req.user.orgId;

    return await this.consensusMessagingService.createMessage(
      topicId,
      orgId,
      refId,
      eventName,
      attributes,
      false,
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @GetOnchainsSwaggerApiDecorator()
  @UseGuards(ApiKeyAuthGuard)
  @Get()
  async onchains(
    @Req() req: IContext,
    @Query() onchainsDto: OnchainsDto,
  ): Promise<OnchainResponseDto[]> {
    const orgId = req.user.orgId;

    return this.consensusMessagingService.onchains(orgId, onchainsDto?.status);
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @GetOnchainSwaggerApiDecorator()
  @UseGuards(ApiKeyAuthGuard)
  @Get(':requestId')
  async onchain(
    @Req() req: IContext,
    @Param('requestId') requestId: string,
  ): Promise<OnchainResponseDto> {
    const orgId = req.user.orgId;

    return this.consensusMessagingService.onchain(orgId, requestId);
  }
}
