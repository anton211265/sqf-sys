import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RiskAgentHumanOutcomeEnum } from '../models/risk-agent-recommendation.entity';

class ResolveRecommendationDto {
  outcome: RiskAgentHumanOutcomeEnum;
  humanActorId: number;
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
