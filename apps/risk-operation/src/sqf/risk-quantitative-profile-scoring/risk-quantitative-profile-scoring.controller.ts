import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RiskQuantitativeProfileScoringService } from './risk-quantitative-profile-scoring.service';
import { CreateRiskQuantitativeProfileScoringDto } from './dto/create-risk-quantitative-profile-scoring.dto';
import { UpdateRiskQuantitativeProfileScoringDto } from './dto/update-risk-quantitative-profile-scoring.dto';

@Controller('/api/risk-quantitative-profile-scoring')
export class RiskQuantitativeProfileScoringController {
  constructor(
    private readonly riskQuantitativeProfileScoringService: RiskQuantitativeProfileScoringService,
  ) {}

  // temperory endpoint to insert new entry
  @Post(':applicationNumber')
  create(@Param('applicationNumber') applicationNumber: string) {
    return this.riskQuantitativeProfileScoringService.create(applicationNumber);
  }

  @Get()
  findAll() {
    return this.riskQuantitativeProfileScoringService.findAll();
  }

  @Get(':applicationNumber')
  findOne(@Param('applicationNumber') applicationNumber: string) {
    return this.riskQuantitativeProfileScoringService.findOne(
      applicationNumber,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateRiskQuantitativeProfileScoringDto: UpdateRiskQuantitativeProfileScoringDto,
  ) {
    return this.riskQuantitativeProfileScoringService.update(
      +id,
      updateRiskQuantitativeProfileScoringDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskQuantitativeProfileScoringService.remove(+id);
  }
}
