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
import { RiskFactorService } from './risk-factor.service';
import { CreateRiskFactorDto } from './dto/create-risk-factor.dto';
import { UpdateRiskFactorDto } from './dto/update-risk-factor.dto';
import { ApiQuery } from '@nestjs/swagger';
import { GetAllRiskFactorDto } from './dto/get-all-risk-factor.dto';

@Controller('/api/risk-factor')
export class RiskFactorController {
  constructor(private readonly riskFactorService: RiskFactorService) {}

  @Post(':riskModelNumber')
  create(
    @Body() createRiskFactorDto: CreateRiskFactorDto,
    @Param('riskModelNumber') riskModelNumber: string,
  ) {
    return this.riskFactorService.create(createRiskFactorDto, riskModelNumber);
  }

  @ApiQuery({
    name: 'includeRiskFactorScoring',
    required: false,
    type: Boolean,
  })
  @Get(':riskModelNumber')
  findAll(
    @Param('riskModelNumber') riskModelNumber: string,
    @Query() getAllRiskFactorDto: GetAllRiskFactorDto,
  ) {
    return this.riskFactorService.findAll(riskModelNumber, getAllRiskFactorDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRiskFactorDto: UpdateRiskFactorDto,
  ) {
    return this.riskFactorService.update(+id, updateRiskFactorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskFactorService.remove(+id);
  }
}
