import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RiskQuantitativeProfileWeightService } from './risk-quantitative-profile-weight.service';
import { CreateRiskQuantitativeProfileWeightDto } from './dto/create-risk-quantitative-profile-weight.dto';
import { UpdateRiskQuantitativeProfileWeightDto } from './dto/update-risk-quantitative-profile-weight.dto';
import { UpdateRiskQuantitativeParameterWeightDto } from './dto/update-risk-quantitative-parameter-weight.dto';
import { UpdateRiskQuantitativeSubParameterWeightDto } from './dto/update-risk-quantitative-sub-parameter-weight.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('/api/risk-quantitative-profile-weight')
export class RiskQuantitativeProfileWeightController {
  constructor(
    private readonly riskQuantitativeProfileWeightService: RiskQuantitativeProfileWeightService,
  ) {}

  @Post(':riskProfileCode')
  create(
    @Param('riskProfileCode') riskProfileCode: string,
    @Body()
    createRiskQuantitativeProfileWeightDto: CreateRiskQuantitativeProfileWeightDto,
  ) {
    return this.riskQuantitativeProfileWeightService.create(
      riskProfileCode,
      createRiskQuantitativeProfileWeightDto,
    );
  }

  @Post(':riskProfileCode/duplicate-risk-profile-weight')
  duplicateDefaultRiskProfileWeights(
    @Param('riskProfileCode') riskProfileCode: string,
  ) {
    return this.riskQuantitativeProfileWeightService.duplicateDefaultRiskProfileWeights(
      riskProfileCode,
    );
  }

  @Get(':riskProfileCode')
  findAll(@Param('riskProfileCode') riskProfileCode: string) {
    return this.riskQuantitativeProfileWeightService.findAll(riskProfileCode);
  }

  @ApiQuery({
    name: 'quantitativeParameterName',
    required: true,
    type: String,
  })
  @Get(':riskProfileCode/parameter')
  findOne(
    @Param('riskProfileCode') riskProfileCode: string,
    @Query('quantitativeParameterName') quantitativeParameterName: string,
  ) {
    return this.riskQuantitativeProfileWeightService.findOne(
      riskProfileCode,
      quantitativeParameterName,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskQuantitativeProfileWeightService.remove(+id);
  }
}
