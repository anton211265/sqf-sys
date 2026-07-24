import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RemotePermissionGuard,
  RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import { ResolveTimerDto, StartTimerDto } from '../dtos';
import { SlaTimerService } from './sla-timer.service';

/**
 * REST face of the SLA engine: the portal's timer monitor + manual
 * start/resolve (dev, backfill, and admin intervention). Business flows
 * use the Kafka face (SLA_TIMER_START/CANCEL) instead.
 */
@Controller('api/sla/timers')
@UseGuards(RemotePermissionGuard)
export class SlaController {
  constructor(private readonly slaTimerService: SlaTimerService) {}

  @Get()
  @RequirePermission('config_policies_view')
  list(@Req() req, @Query('status') status?: string) {
    return this.slaTimerService.list(req.userContext, status);
  }

  @Post()
  @RequirePermission('config_sla_manage')
  start(@Req() req, @Body() dto: StartTimerDto) {
    return this.slaTimerService.start({
      ...dto,
      funderOrganizationId: req.userContext.orgId,
    });
  }

  @Post(':id/resolve')
  @RequirePermission('config_sla_manage')
  resolve(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveTimerDto,
  ) {
    return this.slaTimerService.resolveById(req.userContext, id, dto.reason);
  }
}
