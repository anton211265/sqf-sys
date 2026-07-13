import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { PersonService, CreateUserDto } from './person.service';
import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import createTopics from 'libs/common/kafka/createTopics';
import { ConfigService } from '@nestjs/config';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ClientKafka } from '@nestjs/microservices';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('/api/person')
export class PersonController {
  constructor(
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
    private readonly personService: PersonService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    createTopics(
      this.configService.getOrThrow('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
    this.authClient.subscribeToResponseOf(KafkaTopicEnum.AUTHENTICATE);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  getLogInPerson(@CurrentUser() user: IUserContext) {
    return this.personService.getLogInPersonDetail(user.id, user.orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/users')
  createUser(
    @CurrentUser() user: IUserContext,
    @Body() dto: CreateUserDto,
  ) {
    return this.personService.createUser(user.id, user.orgId, dto);
  }
}
