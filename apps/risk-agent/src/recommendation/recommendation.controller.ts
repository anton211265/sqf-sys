import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { RecommendationService } from './recommendation.service';
import { RiskAgentHumanOutcomeEnum } from '../models/risk-agent-recommendation.entity';

// Decorators are required, not decorative: main.ts registers a global
// ValidationPipe({ whitelist: true }), which strips every property with no
// validation decorator — an undecorated DTO here silently resolves to `{}`
// and the resolve write becomes a no-op for humanOutcome/humanActorId/
// humanNote (confirmed live on the sibling organization-kyc endpoint, which
// had this exact bug before being fixed — only resolvedAt would change,
// since it's set unconditionally in the service, not read off the DTO).
class ResolveRecommendationDto {
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
 * action. Resolving a recommendation here only updates the Risk Agent's own
 * audit trail — the HRA still has to call risk-operation's
 * risk-filter-1-status / submit-for-settlement endpoints themselves to
 * actually move the application forward, per the recommend-only design.
 */
@Controller('/api/crc-dashboard')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('queue')
  async getQueue() {
    return this.recommendationService.getQueueWithRecommendations();
  }

  @Get('queue/:applicationNumber')
  async getQueueItem(@Param('applicationNumber') applicationNumber: string) {
    return this.recommendationService.getQueueItemDetail(applicationNumber);
  }

  @Patch('recommendation/:id/resolve')
  async resolveRecommendation(
    @Param('id') id: number,
    @Body() dto: ResolveRecommendationDto,
  ) {
    return this.recommendationService.resolveRecommendation(id, dto);
  }
}
