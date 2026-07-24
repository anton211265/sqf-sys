import {
  RemotePermissionGuard,
  RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { DealStageEnum, LeadStatusEnum } from '../models/crm.entity';
import { CrmService } from './crm.service';

class CreateLeadDto {
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  organizationId?: number;
}

class UpdateLeadDto extends CreateLeadDto {
  // CreateLeadDto's companyName is required; PATCH must allow omitting it
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsOptional()
  @IsIn(Object.values(LeadStatusEnum))
  status?: LeadStatusEnum;
}

class AssignLeadDto {
  @IsInt()
  rmPersonId: number;
}

class CreateDealDto {
  @IsInt()
  leadId: number;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @Matches(/^[A-Z][A-Z0-9_]{1,9}$/)
  productCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dealValue?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Matches(/^[A-Z][A-Z0-9_]{1,9}$/)
  productCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dealValue?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(Object.values(DealStageEnum))
  stage?: DealStageEnum;
}

class CreateSiteVisitDto {
  @IsOptional()
  @IsInt()
  leadId?: number;

  @IsOptional()
  @IsInt()
  organizationId?: number;

  @IsDateString()
  visitedAt: string;

  @IsString()
  @MaxLength(300)
  summary: string;

  @IsOptional()
  @IsString()
  findings?: string;
}

/**
 * CRM funnel APIs per the signed-off annotation. Every list endpoint
 * supports ?scope=team, which needs crm_supervisor_view on top of the
 * endpoint's own gate (the guard exposes the resolved permission set for
 * exactly this branch). Row-level rule everywhere else: own rows only,
 * supervisors act on any.
 */
@Controller('api/crm')
@UseGuards(RemotePermissionGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  @RequirePermission('crm_pipeline_view')
  listLeads(@Req() req, @Query('scope') scope?: string) {
    return this.crmService.listLeads(req.userContext, scope);
  }

  @Post('leads')
  @RequirePermission('crm_leads_manage')
  createLead(@Req() req, @Body() dto: CreateLeadDto) {
    return this.crmService.createLead(req.userContext, dto);
  }

  @Patch('leads/:id')
  @RequirePermission('crm_leads_manage')
  updateLead(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.crmService.updateLead(req.userContext, id, dto);
  }

  @Post('leads/:id/assign')
  @RequirePermission('crm_assignees_manage')
  assignLead(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: AssignLeadDto) {
    return this.crmService.assignLead(req.userContext, id, dto.rmPersonId);
  }

  @Post('leads/:id/promote')
  @RequirePermission('crm_prospects_promote')
  promoteLead(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.crmService.promoteLead(req.userContext, id);
  }

  @Get('deals')
  @RequirePermission('crm_pipeline_view')
  listDeals(@Req() req, @Query('scope') scope?: string) {
    return this.crmService.listDeals(req.userContext, scope);
  }

  @Post('deals')
  @RequirePermission('crm_deals_manage')
  createDeal(@Req() req, @Body() dto: CreateDealDto) {
    return this.crmService.createDeal(req.userContext, dto);
  }

  @Patch('deals/:id')
  @RequirePermission('crm_deals_manage')
  updateDeal(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDealDto) {
    return this.crmService.updateDeal(req.userContext, id, dto);
  }

  @Get('site-visits')
  @RequirePermission('crm_pipeline_view')
  listSiteVisits(@Req() req, @Query('scope') scope?: string) {
    return this.crmService.listSiteVisits(req.userContext, scope);
  }

  @Post('site-visits')
  @RequirePermission('onboarding_site_visits_manage')
  createSiteVisit(@Req() req, @Body() dto: CreateSiteVisitDto) {
    return this.crmService.createSiteVisit(req.userContext, dto);
  }

  @Get('performance')
  @RequirePermission('crm_supervisor_view')
  performance(@Req() req) {
    return this.crmService.performance(req.userContext);
  }
}
