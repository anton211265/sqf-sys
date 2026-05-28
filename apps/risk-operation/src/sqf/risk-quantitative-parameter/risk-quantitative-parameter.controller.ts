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
import { RiskQuantitativeParameterService } from './risk-quantitative-parameter.service';
import { CreateRiskQuantitativeParameterDto } from './dto/create-risk-quantitative-parameter.dto';
import { UpdateRiskQuantitativeParameterDto } from './dto/update-risk-quantitative-parameter.dto';

@Controller('/api/risk-quantitative-parameter')
export class RiskQuantitativeParameterController {
  constructor(
    private readonly riskQuantitativeParameterService: RiskQuantitativeParameterService,
  ) {}

  @Post()
  create(
    @Body()
    createRiskQuantitativeParameterDto: CreateRiskQuantitativeParameterDto,
  ) {
    return this.riskQuantitativeParameterService.create(
      createRiskQuantitativeParameterDto,
    );
  }

  @Get()
  findAll() {
    return this.riskQuantitativeParameterService.findAll();
  }

  @Get('by-name')
  findOne(@Query('name') name: string) {
    return this.riskQuantitativeParameterService.findOne(name);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateRiskQuantitativeParameterDto: UpdateRiskQuantitativeParameterDto,
  ) {
    return this.riskQuantitativeParameterService.update(
      +id,
      updateRiskQuantitativeParameterDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskQuantitativeParameterService.remove(+id);
  }
}
