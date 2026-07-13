import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FinancialCreditReportService } from './financial-credit-report.service';
import { CreateFinancialCreditReportDto } from './dto/create-financial-credit-report.dto';
import { UpdateFinancialCreditReportDto } from './dto/update-financial-credit-report.dto';
import { ErrorMessage } from '@app/common/apps/common/enums/error-messages.enum';

@Controller('/api/financial-credit-report')
export class FinancialCreditReportController {
  constructor(
    private readonly financialCreditReportService: FinancialCreditReportService,
  ) {}

  @Post()
  create(@Body('organizationId') organizationId: number) {
    return this.financialCreditReportService.create(organizationId);
  }

  @Get()
  findAll() {
    return this.financialCreditReportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialCreditReportService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFinancialCreditReportDto: UpdateFinancialCreditReportDto,
  ) {
    return this.financialCreditReportService.update(
      +id,
      updateFinancialCreditReportDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financialCreditReportService.remove(+id);
  }

  @Get('document/:path(*)')
  async getDocument(@Param('path') path: string, @Res() res: Response) {

    const fileStream =
      await this.financialCreditReportService.getFileStream(path);

    if (!fileStream) {
      return res.status(HttpStatus.NOT_FOUND).send(ErrorMessage.FILE_NOT_FOUND);
    }

    fileStream.pipe(res);
  }
}
