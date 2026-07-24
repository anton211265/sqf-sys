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
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RiskGovernanceService } from './risk-governance.service';

class WeightChangeDto {
  @IsInt()
  weightId: number;

  @IsNumber()
  @Min(0)
  newWeight: number;
}

class CreateChangeRequestDto {
  @Matches(/^[A-Z0-9_-]{2,80}$/, {
    message: 'riskProfileCode must be 2-80 uppercase alphanumerics/underscores/dashes',
  })
  riskProfileCode: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WeightChangeDto)
  weights: WeightChangeDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

class RejectDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

/**
 * Risk profile governance — the risk-operation endpoints behind the Funder
 * Admin Portal's weighting screen. Second cross-service adopter of the
 * Dynamic RBAC RemotePermissionGuard (now in libs/common). The legacy
 * unguarded /api/risk-profile CRUD is untouched pending its own domain
 * swap; these new endpoints are the governed path for weight changes.
 */
@Controller('api/risk-governance')
@UseGuards(RemotePermissionGuard)
export class RiskGovernanceController {
  constructor(private readonly riskGovernanceService: RiskGovernanceService) {}

  @Get('profiles')
  @RequirePermission('risk_profiles_view')
  listProfiles() {
    return this.riskGovernanceService.listProfiles();
  }

  @Get('change-requests')
  @RequirePermission('risk_profiles_view')
  listChangeRequests(@Query('status') status?: string) {
    return this.riskGovernanceService.listChangeRequests(status);
  }

  @Post('change-requests')
  @RequirePermission('risk_profiles_edit')
  createChangeRequest(@Req() req, @Body() dto: CreateChangeRequestDto) {
    return this.riskGovernanceService.createChangeRequest(
      { personId: req.userContext.id, orgId: req.userContext.orgId },
      dto,
    );
  }

  @Post('change-requests/:id/approve')
  @RequirePermission('risk_profiles_approve')
  approve(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.riskGovernanceService.approve(
      { personId: req.userContext.id, orgId: req.userContext.orgId },
      id,
    );
  }

  @Post('change-requests/:id/reject')
  @RequirePermission('risk_profiles_approve')
  reject(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectDto,
  ) {
    return this.riskGovernanceService.reject(
      { personId: req.userContext.id, orgId: req.userContext.orgId },
      id,
      dto.note,
    );
  }
}
