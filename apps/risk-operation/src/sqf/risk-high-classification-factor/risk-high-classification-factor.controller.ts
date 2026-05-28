import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RiskHighClassificationFactorService } from './risk-high-classification-factor.service';
import { CreateRiskHighClassificationFactorDto } from './dto/create-risk-high-classification-factor.dto';
import { UpdateRiskHighClassificationFactorDto } from './dto/update-risk-high-classification-factor.dto';
import { plainToInstance } from 'class-transformer';

@Controller('/api/risk-high-classification-factor')
export class RiskHighClassificationFactorController {
  constructor(
    private readonly riskHighClassificationFactorService: RiskHighClassificationFactorService,
  ) {}

  @Post(':riskModelNumber')
  create(
    @Body()
    createRiskHighClassificationFactorDto: CreateRiskHighClassificationFactorDto[],
    @Param('riskModelNumber') riskModelNumber: string,
  ) {
    // Apply transformation manually before passing to service
    const transformedDto = createRiskHighClassificationFactorDto.map((dto) =>
      plainToInstance(CreateRiskHighClassificationFactorDto, dto),
    );

    return this.riskHighClassificationFactorService.create(
      riskModelNumber,
      transformedDto,
    );
  }

  @Get(':riskModelNumber')
  findAll(@Param('riskModelNumber') riskModelNumber: string) {
    return this.riskHighClassificationFactorService.findAll(riskModelNumber);
  }

  @Patch(':riskModelNumber/:id')
  update(
    @Param('riskModelNumber') riskModelNumber: string,
    @Param('id') id: number,
    @Body()
    updateRiskHighClassificationFactorDto: UpdateRiskHighClassificationFactorDto,
  ) {
    return this.riskHighClassificationFactorService.update(
      riskModelNumber,
      +id,
      updateRiskHighClassificationFactorDto,
    );
  }

  @Delete(':riskModelNumber/:id')
  remove(
    @Param('riskModelNumber') riskModelNumber: string,
    @Param('id') id: number,
  ) {
    return this.riskHighClassificationFactorService.remove(
      riskModelNumber,
      +id,
    );
  }
}
