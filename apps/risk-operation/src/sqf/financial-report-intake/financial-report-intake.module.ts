import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/common/database/database.module';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { FinancialReportIntakeController } from './financial-report-intake.controller';
import { FinancialReportIntakeService } from './financial-report-intake.service';

// Phase 3 of the document-management redesign: consumes DOCUMENT_EXTRACTED
// (FINANCIAL_STATEMENTS only) into financial_credit_report rows.
@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([FinancialCreditReport, ProcessedEvent]),
  ],
  controllers: [FinancialReportIntakeController],
  providers: [
    FinancialReportIntakeService,
    FinancialCreditReportRepository,
    ProcessedEventRepository,
  ],
})
export class FinancialReportIntakeModule {}
