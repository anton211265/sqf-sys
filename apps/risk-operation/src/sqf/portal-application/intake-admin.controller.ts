import {
  RemotePermissionGuard,
  RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PortalApplicationService } from './portal-application.service';

/**
 * Funder-facing web-intake endpoints (Customer Portal pass 1):
 * - the CRC "new application bucket" (passed applications, oldest first)
 * - the full intake list for the RM Supervisor view
 * - the RM fail->pass override (blueprint: recorded in the system log)
 */
@Controller('api/intake')
@UseGuards(RemotePermissionGuard)
export class IntakeAdminController {
  constructor(private readonly portalApplicationService: PortalApplicationService) {}

  @Get('applications')
  @RequirePermission('risk_applications_view')
  list(@Req() req: any, @Query('bucket') bucket?: string) {
    return this.portalApplicationService.listIntake(
      req.userContext.orgId,
      bucket === 'crc' ? 'crc' : 'all',
    );
  }

  @Get('applications/:id')
  @RequirePermission('risk_applications_view')
  detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.portalApplicationService.getIntakeDetail(req.userContext.orgId, id);
  }

  @Post('applications/:id/override-pass')
  @RequirePermission('onboarding_applications_manage')
  overridePass(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.portalApplicationService.overrideFailToPass(
      req.userContext.orgId,
      req.userContext.id,
      id,
    );
  }
}
