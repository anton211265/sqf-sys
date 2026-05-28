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
import { RiskProfileService } from './risk-profile.service';
import { CreateRiskProfileDto } from './dto/create-risk-profile.dto';
import { UpdateRiskProfileDto } from './dto/update-risk-profile.dto';
import { ApiQuery } from '@nestjs/swagger';
import { UpdateParameterWeightAndManualTriggerFlagDto } from './dto/update-parameter-weight-and-manual-trigger-flag.dto';

@Controller('/api/risk-profile')
export class RiskProfileController {
  constructor(private readonly riskProfileService: RiskProfileService) {}

  @Post()
  create(@Body() createRiskProfileDto: CreateRiskProfileDto) {
    return this.riskProfileService.create(createRiskProfileDto);
  }

  @Get()
  findAll() {
    return this.riskProfileService.findAll();
  }

  @Get(':riskProfileCode')
  findOne(@Param('riskProfileCode') riskProfileCode: string) {
    return this.riskProfileService.findOne(riskProfileCode);
  }

  @ApiQuery({
    name: 'riskQuantitativeParameterName',
    required: true,
    type: String,
  })
  @Get(':riskProfileCode/parameters')
  getRiskProfileParametersByName(
    @Param('riskProfileCode') riskProfileCode: string,
    @Query('riskQuantitativeParameterName')
    riskQuantitativeParameterName: string,
  ) {
    return this.riskProfileService.getRiskProfileParametersByName(
      riskProfileCode,
      riskQuantitativeParameterName,
    );
  }

  @Patch(':riskProfileCode')
  update(
    @Param('riskProfileCode') riskProfileCode: string,
    @Body() updateRiskProfileDto: UpdateRiskProfileDto,
  ) {
    return this.riskProfileService.update(
      riskProfileCode,
      updateRiskProfileDto,
    );
  }

  @Patch(':riskProfileCode/parameters')
  updateParametersWeightandManualTriggerFlags(
    @Param('riskProfileCode') riskProfileCode: string,
    @Body()
    updateParameterWeightAndManualTriggerFlagDto: UpdateParameterWeightAndManualTriggerFlagDto,
  ) {
    return this.riskProfileService.updateParametersWeightandManualTriggerFlags(
      riskProfileCode,
      updateParameterWeightAndManualTriggerFlagDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskProfileService.remove(+id);
  }
}
