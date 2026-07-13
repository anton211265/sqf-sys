import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { LendingProductSubscriptionService } from './lending-product-subscription.service';
import {
  CreateLendingProductSubscriptionDto,
  UpdateLendingProductSubscriptionDto,
} from './dto/create-lending-product-subscription.dto';

// Intended access (future dynamic RBAC): SUPER_ADMIN / RM_TEAM_LEAD manage.
// Do not add hardcoded CASL rules here.
@Controller('/api/lending-product-subscriptions')
@UseGuards(JwtAuthGuard)
export class LendingProductSubscriptionController {
  constructor(
    private readonly subscriptionService: LendingProductSubscriptionService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: IUserContext,
    @Body() dto: CreateLendingProductSubscriptionDto,
  ) {
    return this.subscriptionService.create(user, dto);
  }

  @Get()
  @ApiQuery({ name: 'clientPersonaId', required: false, type: Number })
  async findAll(
    @CurrentUser() user: IUserContext,
    @Query('clientPersonaId') clientPersonaId?: number,
  ) {
    return this.subscriptionService.findAll(user, {
      clientPersonaId: clientPersonaId ? Number(clientPersonaId) : undefined,
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLendingProductSubscriptionDto,
  ) {
    return this.subscriptionService.update(user, id, dto);
  }
}
