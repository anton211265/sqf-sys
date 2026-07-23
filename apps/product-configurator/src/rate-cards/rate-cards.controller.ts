import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RemotePermissionGuard,
  RequirePermission,
} from '../rbac/remote-permission.guard';
import { RateCardFieldsDto } from '../dtos';
import { RateCardsService } from './rate-cards.service';

@Controller('api')
@UseGuards(RemotePermissionGuard)
export class RateCardsController {
  constructor(private readonly rateCardsService: RateCardsService) {}

  @Get('products/:productId/rate-cards')
  @RequirePermission('config_products_view')
  list(@Req() req, @Param('productId', ParseIntPipe) productId: number) {
    return this.rateCardsService.listForProduct(req.userContext, productId);
  }

  @Post('products/:productId/rate-cards')
  @RequirePermission('config_rate_cards_manage')
  createDraft(
    @Req() req,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: RateCardFieldsDto,
  ) {
    return this.rateCardsService.createDraft(req.userContext, productId, dto);
  }

  @Patch('rate-cards/:id')
  @RequirePermission('config_rate_cards_manage')
  updateDraft(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateCardFieldsDto,
  ) {
    return this.rateCardsService.updateDraft(req.userContext, id, dto);
  }

  @Post('rate-cards/:id/publish')
  @RequirePermission('config_rate_cards_publish')
  publish(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.rateCardsService.publish(req.userContext, id);
  }
}
