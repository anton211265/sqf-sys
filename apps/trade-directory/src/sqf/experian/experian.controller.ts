import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ExperianService } from '../../experian/experian.service';

@Controller('/api/experian')
export class ExperianController {
  constructor(private readonly experianService: ExperianService) {}

  @Get()
  async getExperianReports(@Query('clientPersonaId') clientPersonaId: number) {
    return await this.experianService.getExperians(clientPersonaId);
  }
}
