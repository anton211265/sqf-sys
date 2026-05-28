import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RiskHighClassificationScoringService } from './risk-high-classification-scoring.service';
import { CreateRiskHighClassificationScoringDto } from './dto/create-risk-high-classification-scoring.dto';
import { UpdateRiskHighClassificationScoringDto } from './dto/update-risk-high-classification-scoring.dto';

@Controller('/api/risk-high-classification-scoring')
export class RiskHighClassificationScoringController {
  constructor(
    private readonly riskHighClassificationScoringService: RiskHighClassificationScoringService,
  ) {}

  @Post(':applicationNumber')
  create(
    @Param('applicationNumber') applicationNumber: string,
    @Body()
    createRiskHighClassificationScoringDto: CreateRiskHighClassificationScoringDto,
  ) {
    return this.riskHighClassificationScoringService.create(
      applicationNumber,
      createRiskHighClassificationScoringDto.riskFactors,
    );
  }

  @Get(':applicationNumber')
  findAll(@Param('applicationNumber') applicationNumber: string) {
    return this.riskHighClassificationScoringService.findAll(applicationNumber);
  }

  @Patch(':applicationNumber')
  update(
    @Param('applicationNumber') applicationNumber: string,
    @Body()
    updateRiskHighClassificationScoringDto: UpdateRiskHighClassificationScoringDto,
  ) {
    return this.riskHighClassificationScoringService.update(
      applicationNumber,
      updateRiskHighClassificationScoringDto,
    );
  }
}
