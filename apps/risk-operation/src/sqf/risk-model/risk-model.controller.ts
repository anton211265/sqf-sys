import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { RiskModelService } from './risk-model.service';
import { CreateRiskModelDto } from './dto/create-risk-model.dto';
import { UpdateRiskModelDto } from './dto/update-risk-model.dto';
import { UpdateRiskModelStatusDto } from './dto/update-risk-model-status.dto';
import { UpdateRiskThresholdDto } from './dto/update-risk-thresholds.dto';
import { ApiQuery } from '@nestjs/swagger';
import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';
import { GetRiskModelsDto } from './dto/get-all-risk-model.dto';

@Controller('/api/risk-model')
export class RiskModelController {
  constructor(private readonly riskModelService: RiskModelService) {}

  @Post()
  create(@Body() createRiskModelDto: CreateRiskModelDto) {
    return this.riskModelService.create(createRiskModelDto);
  }

  @Get()
  @ApiQuery({
    name: 'riskModelStatus',
    required: false,
    enum: RiskModelStatusEnum,
    description: 'Filter risk models by status (PUBLISHED, DRAFT, ARCHIVED)',
  })
  findAll(@Query() getRiskModelsDto: GetRiskModelsDto) {
    return this.riskModelService.findAll(getRiskModelsDto);
  }

  @Get(':riskModelNumber')
  findOne(@Param('riskModelNumber') riskModelNumber: string) {
    return this.riskModelService.findOne(riskModelNumber);
  }

  @Patch(':riskModelNumber')
  update(
    @Param('riskModelNumber') riskModelNumber: string,
    @Body() updateRiskModelDto: UpdateRiskModelDto,
  ) {
    return this.riskModelService.update(riskModelNumber, updateRiskModelDto);
  }

  @Delete(':riskModelNumber')
  remove(@Param('riskModelNumber') riskModelNumber: string) {
    return this.riskModelService.remove(riskModelNumber);
  }

  @Patch('/:riskModelNumber/update-status')
  updateRiskModelStatus(
    @Param('riskModelNumber') riskModelNumber: string,
    @Body() updateRiskModelDto: UpdateRiskModelStatusDto,
  ) {
    return this.riskModelService.updateRiskModelStatus(
      riskModelNumber,
      updateRiskModelDto.status,
    );
  }

  @Patch(':riskModelNumber/risk-thresholds')
  async updateThresholds(
    @Param('riskModelNumber') riskModelNumber: string,
    @Body() updateRiskThresholdDto: UpdateRiskThresholdDto,
  ) {
    return this.riskModelService.updateThresholds(
      riskModelNumber,
      updateRiskThresholdDto,
    );
  }
}
