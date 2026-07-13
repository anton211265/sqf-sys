import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { KycAgencyService } from '../../kyc-agency/kyc-agency.service';

@Controller('/api/kyc-agency')
export class KycAgencyController {
  constructor(private readonly kycAgencyService: KycAgencyService) {}

  @Get()
  async getKycAgencyReports(@Query('clientPersonaId') clientPersonaId: number) {
    return await this.kycAgencyService.getKycAgencyReports(clientPersonaId);
  }
}
