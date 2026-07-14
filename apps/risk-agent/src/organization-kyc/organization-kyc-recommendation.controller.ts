import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { RiskAgentHumanOutcomeEnum } from '../models/risk-agent-recommendation.entity';
import { OrganizationKycRecommendationService } from './organization-kyc-recommendation.service';

// Decorators are required, not decorative: main.ts registers a global
// ValidationPipe({ whitelist: true }), which strips every property with no
// validation decorator — an undecorated DTO here silently resolves to `{}`
// and the resolve write becomes a no-op for humanOutcome/humanActorId/
// humanNote (confirmed live; only resolvedAt would change since it's set
// unconditionally in the service, not read off the DTO).
class ResolveOrganizationKycDto {
  @IsEnum(RiskAgentHumanOutcomeEnum)
  outcome: RiskAgentHumanOutcomeEnum;

  @IsInt()
  humanActorId: number;

  @IsString()
  @IsOptional()
  humanNote?: string;
}

/**
 * Read API for the CRC dashboard (apps/web) plus the HRA's confirm/override
 * action on an organization KYC-intake recommendation. Resolving here only
 * updates the Risk Agent's own audit trail — it doesn't set any
 * verification/KYC status on the Organization itself (trade-directory has
 * no such field to write to today).
 */
@Controller('/api/crc-dashboard/organization-kyc')
export class OrganizationKycRecommendationController {
  constructor(
    private readonly organizationKycRecommendationService: OrganizationKycRecommendationService,
  ) {}

  @Get()
  async list() {
    return this.organizationKycRecommendationService.list();
  }

  @Get(':organizationId')
  async getForOrganization(@Param('organizationId') organizationId: number) {
    return this.organizationKycRecommendationService.getForOrganization(
      organizationId,
    );
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: number,
    @Body() dto: ResolveOrganizationKycDto,
  ) {
    return this.organizationKycRecommendationService.resolve(id, dto);
  }
}
