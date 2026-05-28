import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RiskManualReviewAlertService } from './risk-manual-review-alert.service';
import { CreateRiskManualReviewAlertDto } from './dto/create-risk-manual-review-alert.dto';
import { UpdateRiskManualReviewAlertDto } from './dto/update-risk-manual-review-alert.dto';

@Controller('/api/risk-manual-review-alert')
export class RiskManualReviewAlertController {
  constructor(
    private readonly riskManualReviewAlertService: RiskManualReviewAlertService,
  ) {}

  @Post()
  create(
    @Body() createRiskManualReviewAlertDto: CreateRiskManualReviewAlertDto,
  ) {
    return this.riskManualReviewAlertService.create(
      createRiskManualReviewAlertDto,
    );
  }

  @Get(':applicationNumber')
  findAll(@Param('applicationNumber') applicationNumber: string) {
    return this.riskManualReviewAlertService.findAll(applicationNumber);
  }

  // Temperory endpoint to generate manual review alerts
  @Get(':applicationNumber/generate')
  generateThresholdBreachAlerts(
    @Param('applicationNumber') applicationNumber: string,
  ) {
    return this.riskManualReviewAlertService.generateThresholdBreachAlerts(
      applicationNumber,
    );
  }

  @Post(':applicationNumber/regenerate')
  async regenerateThresholdBreachAlerts(
    @Param('applicationNumber') applicationNumber: string,
  ) {
    return this.riskManualReviewAlertService.regenerateThresholdBreachAlerts(
      applicationNumber,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.riskManualReviewAlertService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRiskManualReviewAlertDto: UpdateRiskManualReviewAlertDto,
  ) {
    return this.riskManualReviewAlertService.update(
      +id,
      updateRiskManualReviewAlertDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskManualReviewAlertService.remove(+id);
  }
}
