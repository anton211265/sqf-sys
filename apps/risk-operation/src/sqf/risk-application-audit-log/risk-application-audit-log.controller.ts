import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RiskApplicationAuditLogService } from './risk-application-audit-log.service';
import { CreateRiskApplicationAuditLogDto } from './dto/create-risk-application-audit-log.dto';
import { UpdateRiskApplicationAuditLogDto } from './dto/update-risk-application-audit-log.dto';

@Controller('/api/risk-application-audit-log')
export class RiskApplicationAuditLogController {
  constructor(
    private readonly riskApplicationAuditLogService: RiskApplicationAuditLogService,
  ) {}

  @Post()
  create(
    @Body() createRiskApplicationAuditLogDto: CreateRiskApplicationAuditLogDto,
  ) {
    return this.riskApplicationAuditLogService.create(
      createRiskApplicationAuditLogDto,
    );
  }

  @Get(':applicationNumber')
  findAuditLogsByApplicationNumber(
    @Param('applicationNumber') applicationNumber: string,
  ) {
    return this.riskApplicationAuditLogService.findAuditLogsByApplicationNumber(
      applicationNumber,
    );
  }

  @Get()
  findAll() {
    return this.riskApplicationAuditLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.riskApplicationAuditLogService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRiskApplicationAuditLogDto: UpdateRiskApplicationAuditLogDto,
  ) {
    return this.riskApplicationAuditLogService.update(
      +id,
      updateRiskApplicationAuditLogDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.riskApplicationAuditLogService.remove(+id);
  }
}
