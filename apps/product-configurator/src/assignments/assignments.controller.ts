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
import { CreateAssignmentDto } from '../dtos';
import { AssignmentsService } from './assignments.service';
import { ConfigAuditService } from '../audit/config-audit.service';

@Controller('api')
@UseGuards(RemotePermissionGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly auditService: ConfigAuditService,
  ) {}

  @Get('assignments')
  @RequirePermission('config_products_view')
  list(@Req() req, @Query('organizationId') organizationId?: string) {
    const orgFilter = organizationId ? parseInt(organizationId, 10) : undefined;
    return this.assignmentsService.list(
      req.userContext,
      Number.isNaN(orgFilter) ? undefined : orgFilter,
    );
  }

  @Post('assignments')
  @RequirePermission('config_products_manage')
  create(@Req() req, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(req.userContext, dto);
  }

  @Get('assignments/:id/render/:templateId')
  @RequirePermission('config_products_view')
  render(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    return this.assignmentsService.render(req.userContext, id, templateId);
  }

  @Get('audit')
  @RequirePermission('config_products_view')
  audit(@Req() req, @Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 100;
    return this.auditService.list(
      req.userContext.orgId,
      Number.isNaN(parsed) ? 100 : parsed,
    );
  }
}
