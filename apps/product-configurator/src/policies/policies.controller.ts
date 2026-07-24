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
} from '@app/common/rbac/remote-permission.guard';
import {
  PolicySettingsDto,
  UpsertApprovalRuleDto,
  UpsertCreditRangeDto,
  UpsertSlaDto,
} from '../dtos';
import { PoliciesService } from './policies.service';

/**
 * Governance Policies node: one view gate, four separately-keyed action
 * families (SLA / approval matrix / credit ranges / operational policies) —
 * each maps to a different real role per the annotation's litmus test.
 */
@Controller('api/policies')
@UseGuards(RemotePermissionGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @RequirePermission('config_policies_view')
  overview(@Req() req) {
    return this.policiesService.overview(req.userContext);
  }

  @Put('slas')
  @RequirePermission('config_sla_manage')
  upsertSla(@Req() req, @Body() dto: UpsertSlaDto) {
    return this.policiesService.upsertSla(req.userContext, dto);
  }

  @Delete('slas/:id')
  @RequirePermission('config_sla_manage')
  deleteSla(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.policiesService.deleteSla(req.userContext, id);
  }

  @Put('approval-rules')
  @RequirePermission('config_approval_matrix_manage')
  upsertApprovalRule(@Req() req, @Body() dto: UpsertApprovalRuleDto) {
    return this.policiesService.upsertApprovalRule(req.userContext, dto);
  }

  @Delete('approval-rules/:id')
  @RequirePermission('config_approval_matrix_manage')
  deleteApprovalRule(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.policiesService.deleteApprovalRule(req.userContext, id);
  }

  @Put('credit-ranges')
  @RequirePermission('config_credit_ranges_manage')
  upsertCreditRange(@Req() req, @Body() dto: UpsertCreditRangeDto) {
    return this.policiesService.upsertCreditRange(req.userContext, dto);
  }

  @Delete('credit-ranges/:id')
  @RequirePermission('config_credit_ranges_manage')
  deleteCreditRange(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.policiesService.deleteCreditRange(req.userContext, id);
  }

  @Patch('settings')
  @RequirePermission('config_policies_manage')
  patchSettings(@Req() req, @Body() dto: PolicySettingsDto) {
    return this.policiesService.patchSettings(req.userContext, dto);
  }
}
