import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { RiskApplicationScoringService } from './risk-application-scoring.service';
import { UpdateRiskApplicationScoringDto } from './dto/update-risk-application-scoring.dto';
import { AssignRiskModelToApplicationScoringDto } from './dto/assign-risk-model-to-application-scoring.dto';
import { SubmitApplicationForSettlementDto } from './dto/submit-application-for-settlement.dto';
import { changeRiskProfileToApplicationScoringDto } from './dto/change-risk-profile-to-application-scoring.dto';
import { UpdateRiskFilter1StatusDto } from './dto/update-risk-filter-1-status.dto';

@Controller('/api/risk-application-scoring')
export class RiskApplicationScoringController {
  constructor(
    private readonly riskApplicationScoringService: RiskApplicationScoringService,
  ) {}

  @Post(':applicationNumber/assign-risk-model')
  @HttpCode(HttpStatus.OK) // This forces a 200 response
  assignRiskModel(
    @Param('applicationNumber') applicationNumber: string,
    @Body()
    assignRiskModelToApplicationScoringDto: AssignRiskModelToApplicationScoringDto,
  ) {
    return this.riskApplicationScoringService.assignRiskModel(
      applicationNumber,
      assignRiskModelToApplicationScoringDto,
    );
  }

  @Patch(':applicationNumber/change-risk-profile')
  @HttpCode(HttpStatus.OK) // This forces a 200 response
  changeRiskProfile(
    @Param('applicationNumber') applicationNumber: string,
    @Body()
    changeRiskProfileToApplicationScoringDto: changeRiskProfileToApplicationScoringDto,
  ) {
    return this.riskApplicationScoringService.changeRiskProfile(
      applicationNumber,
      changeRiskProfileToApplicationScoringDto,
    );
  }

  @Get(':applicationNumber')
  findOne(@Param('applicationNumber') applicationNumber: string) {
    return this.riskApplicationScoringService.findOne(applicationNumber);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRiskApplicationScoringDto: UpdateRiskApplicationScoringDto,
  ) {
    return this.riskApplicationScoringService.update(
      +id,
      updateRiskApplicationScoringDto,
    );
  }

  @Post(':applicationNumber/submit-for-settlement')
  @HttpCode(HttpStatus.OK) // This forces a 200 response
  submitApplicationForSettlement(
    @Param('applicationNumber') applicationNumber: string,
    @Body()
    submitApplicationForSettlementDto: SubmitApplicationForSettlementDto,
  ) {
    return this.riskApplicationScoringService.submitApplicationForSettlement(
      applicationNumber,
      submitApplicationForSettlementDto,
    );
  }

  @Patch(':applicationNumber/risk-filter-1-status')
  async updateRiskFilter1Status(
    @Param('applicationNumber') applicationNumber: string,
    @Body() updateRiskFilter1StatusDto: UpdateRiskFilter1StatusDto,
  ) {
    return this.riskApplicationScoringService.updateRiskFilter1Status(
      applicationNumber,
      updateRiskFilter1StatusDto,
    );
  }
}
