import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { KafkaJwtAuthGuard } from '@app/common/apps/common/guard/kafka-jwt.guard';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { TRADE_SERVICE } from '@app/common/constants/services';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Post,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import createTopics from 'libs/common/kafka/createTopics';
import { AUTH_SERVICE, IAuthService } from './auth.interface';
import { CreateApiKeyDto } from './dto/request/create-api-key.dto';
import { CreateApiKeyResponseDto } from './dto/response/create-api-key-response.dto';
import { GetApiKeyResponseDto } from './dto/response/get-api-key-response.dto';
import { DeleteApiKeyResponseDto } from './dto/response/delete-api-key-response.dto';
import { UpdateApiKeyDto } from './dto/request/update-api-key.dto';
import { UpdateApiKeyResponseDto } from './dto/response/update-api-key-response.dto';

@Controller('api-key')
export class AuthController implements OnModuleInit {
  constructor(
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
    private readonly configService: ConfigService,
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
  ) {}

  async onModuleInit() {
    createTopics(
      this.configService.getOrThrow('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
    this.authClient.subscribeToResponseOf(KafkaTopicEnum.AUTHENTICATE);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Post()
  async createApiKey(
    @CurrentUser() user: IUserContext,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<CreateApiKeyResponseDto> {
    return this.authService.creatApiKey(user.orgId, createApiKeyDto.name);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Get()
  async getApiKeys(
    @CurrentUser() user: IUserContext,
  ): Promise<GetApiKeyResponseDto[]> {
    return this.authService.getApiKeys(user.orgId);
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Delete(':id')
  async deleteApiKey(
    @CurrentUser() user: IUserContext,
    @Param('id') id: string,
  ): Promise<DeleteApiKeyResponseDto> {
    return this.authService.deleteApiKey(user.orgId, parseInt(id));
  }

  @UseGuards(KafkaJwtAuthGuard)
  @Post(':id')
  async updateApiKey(
    @CurrentUser() user: IUserContext,
    @Param('id') id: string,
    @Body() updateApiKey: UpdateApiKeyDto,
  ): Promise<UpdateApiKeyResponseDto> {
    return this.authService.updateApiKey(
      user.orgId,
      parseInt(id),
      updateApiKey.name,
    );
  }
}
