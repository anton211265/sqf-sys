import { PartialType } from '@nestjs/swagger';
import { CreateFinancialCreditReportDto } from './create-financial-credit-report.dto';

export class UpdateFinancialCreditReportDto extends PartialType(CreateFinancialCreditReportDto) {}
