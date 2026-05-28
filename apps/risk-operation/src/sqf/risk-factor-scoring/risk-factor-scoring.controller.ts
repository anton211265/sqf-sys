import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { RiskFactorScoringService } from './risk-factor-scoring.service';
import { AssignScoreToRiskFactorScoringDto } from './dto/assign-score-to-risk-factor-scoring.dto';
import { UpdateRiskFactorScoringDto } from './dto/update-risk-factor-scoring.dto';
import { GetRiskFactorScoresDto } from './dto/get-risk-factors-scores.dto';

@Controller('/api/risk-factor-scoring')
export class RiskFactorScoringController {
  constructor(
    private readonly riskFactorScoringService: RiskFactorScoringService,
  ) {}

  @Post(':applicationNumber/store-risk-scores')
  @HttpCode(HttpStatus.OK)
  storeRiskScores(
    @Param('applicationNumber') applicationNumber: string,
    @Body()
    assignScoreToRiskFactorScoringDto: AssignScoreToRiskFactorScoringDto,
  ) {
    return this.riskFactorScoringService.storeRiskScores(
      applicationNumber,
      assignScoreToRiskFactorScoringDto,
    );
  }

  @Get(':applicationNumber/risk-factor-scores')
  getRiskFactorScores(
    @Param('applicationNumber') applicationNumber: string,
    @Query() getRiskFactorScoresDto: GetRiskFactorScoresDto,
  ) {
    return this.riskFactorScoringService.getRiskFactorScores(
      applicationNumber,
      getRiskFactorScoresDto.includeRiskParameterGrading,
    );
  }

  @Get(':applicationNumber/risk-factor-survey-progress')
  getRiskFactorSurveyProgress(
    @Param('applicationNumber') applicationNumber: string,
  ) {
    return this.riskFactorScoringService.getRiskFactorSurveyProgress(
      applicationNumber,
    );
  }

  @Patch(':applicationNumber/mark-complete')
  @HttpCode(HttpStatus.OK)
  completeRiskSurvey(@Param('applicationNumber') applicationNumber: string) {
    return this.riskFactorScoringService.completeRiskSurvey(applicationNumber);
  }
}
