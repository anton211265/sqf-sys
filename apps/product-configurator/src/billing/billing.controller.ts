import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RemotePermissionGuard,
  RequirePermission,
} from '../rbac/remote-permission.guard';
import { BillingSettingsDto, UpsertFeeDto, UpsertRateIndexDto } from '../dtos';
import { BillingService } from './billing.service';

@Controller('api/billing')
@UseGuards(RemotePermissionGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermission('config_billing_view')
  overview(@Req() req) {
    return this.billingService.overview(req.userContext);
  }

  @Put('indices')
  @RequirePermission('config_billing_manage')
  upsertIndex(@Req() req, @Body() dto: UpsertRateIndexDto) {
    return this.billingService.upsertIndex(req.userContext, dto);
  }

  @Delete('indices/:id')
  @RequirePermission('config_billing_manage')
  deleteIndex(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.billingService.deleteIndex(req.userContext, id);
  }

  @Put('fees')
  @RequirePermission('config_billing_manage')
  upsertFee(@Req() req, @Body() dto: UpsertFeeDto) {
    return this.billingService.upsertFee(req.userContext, dto);
  }

  @Delete('fees/:id')
  @RequirePermission('config_billing_manage')
  deleteFee(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.billingService.deleteFee(req.userContext, id);
  }

  @Patch('settings')
  @RequirePermission('config_billing_manage')
  patchSettings(@Req() req, @Body() dto: BillingSettingsDto) {
    return this.billingService.patchSettings(req.userContext, dto);
  }
}
