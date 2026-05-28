import { TRADE_SERVICE } from '@app/common/constants/services';
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
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { IWebhookService, WEBHOOK_SERVICE } from './webhook.interface';
import createTopics from 'libs/common/kafka/createTopics';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { KafkaJwtAuthGuard } from '@app/common/apps/common/guard/kafka-jwt.guard';
import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { GetWebhooksResponseDto } from './dto/response/get-webhooks-response.dto';
import { CreateWebhookDto } from './dto/request/create-webhook.dto';
import { CreateWebhookResponseDto } from './dto/response/create-webhook-response.dto';
import { UpdateWebhookDto } from './dto/request/update-webhook.dto';
import { UpdateWebhookResponseDto } from './dto/response/update-webhook-response.dto';
import { GetWebhookResponseDto } from './dto/response/get-webhook-response.dto';

@Controller('webhook')
export class WebhookController implements OnModuleInit {
  constructor(
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
    private readonly configService: ConfigService,
    @Inject(WEBHOOK_SERVICE) private readonly webhookService: IWebhookService,
  ) {}

  async onModuleInit() {
    createTopics(
      this.configService.getOrThrow('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
    this.authClient.subscribeToResponseOf(KafkaTopicEnum.AUTHENTICATE);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Get()
  async getWebhooks(
    @CurrentUser() user: IUserContext,
  ): Promise<GetWebhooksResponseDto[]> {
    return this.webhookService.getWebhooks(user.orgId);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Post()
  async createWebhook(
    @CurrentUser() user: IUserContext,
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<CreateWebhookResponseDto> {
    return this.webhookService.createWebhook(user.orgId, createWebhookDto);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Post(':id')
  async updateWebhook(
    @CurrentUser() user: IUserContext,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ): Promise<UpdateWebhookResponseDto> {
    return this.webhookService.updateWebhook(user.orgId, id, updateWebhookDto);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Get(':id')
  async getWebhook(
    @CurrentUser() user: IUserContext,
    @Param('id') id: string,
  ): Promise<GetWebhookResponseDto> {
    return this.webhookService.getWebhook(user.orgId, id);
  }
}
