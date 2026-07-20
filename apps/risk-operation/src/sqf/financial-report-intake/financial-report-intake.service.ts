import { Injectable, Logger } from '@nestjs/common';
import { DocumentExtractedEvent } from '@app/common/apps/common/interface/document-extracted-event.interface';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';

interface ExtractedFiscalYear {
  fiscalYear: number;
  totalRevenue?: number | null;
  netProfit?: number | null;
  totalCurrentAssets?: number | null;
  totalCurrentLiabilities?: number | null;
  inventory?: number | null;
  accountReceivables?: number | null;
  totalDebt?: number | null;
  totalEquity?: number | null;
  ebitda?: number | null;
  interestExpense?: number | null;
}

// Ingests FINANCIAL_STATEMENTS extraction results from document-management
// into financial_credit_report — the default risk profile's scoring input
// (one row per organization + fiscal year; trend sub-parameters read across
// years). Ratio columns are computed deterministically here, not by the LLM.
@Injectable()
export class FinancialReportIntakeService {
  private readonly logger = new Logger(FinancialReportIntakeService.name);

  constructor(
    private readonly financialCreditReportRepository: FinancialCreditReportRepository,
  ) {}

  async ingest(event: DocumentExtractedEvent): Promise<void> {
    const { subjectOrganizationId, extractedData, documentUuid } = event;
    const companyName = (extractedData.companyName as string) ?? 'UNKNOWN';
    const fiscalYears =
      (extractedData.fiscalYears as ExtractedFiscalYear[]) ?? [];

    if (!fiscalYears.length) {
      this.logger.warn(
        `Document ${documentUuid} had no fiscal years to ingest for org ${subjectOrganizationId}`,
      );
      return;
    }

    for (const year of fiscalYears) {
      if (!year.fiscalYear) continue;

      const existing = await this.financialCreditReportRepository.findOne({
        where: {
          organizationId: subjectOrganizationId,
          reportYear: year.fiscalYear,
        },
      });

      const report = new FinancialCreditReport({
        ...(existing ? { id: existing.id } : {}),
        organizationId: subjectOrganizationId,
        organizationName: companyName,
        reportYear: year.fiscalYear,
        // Not stated on financial statements; 0 = unknown.
        yearsOfOperation: existing?.yearsOfOperation ?? 0,
        totalRevenue: this.num(year.totalRevenue),
        netProfit: this.num(year.netProfit),
        totalCurrentAssets: this.num(year.totalCurrentAssets),
        totalCurrentLiabilities: this.num(year.totalCurrentLiabilities),
        accountReceivables: this.num(year.accountReceivables),
        totalDebt: this.num(year.totalDebt),
        totalEquity: this.num(year.totalEquity),
        ebitda: this.num(year.ebitda),
        interestExpense: this.num(year.interestExpense),
        currentRatio: this.ratio(
          year.totalCurrentAssets,
          year.totalCurrentLiabilities,
        ),
        debtToEquity: this.ratio(year.totalDebt, year.totalEquity),
        debtToEbitda: this.ratio(year.totalDebt, year.ebitda),
        debtToCapital: this.ratio(
          year.totalDebt,
          (year.totalDebt ?? 0) + (year.totalEquity ?? 0) || null,
        ),
        ebitdaToInterestExpense: this.ratio(year.ebitda, year.interestExpense),
      });

      await this.financialCreditReportRepository.save(report);
      this.logger.log(
        `${existing ? 'Updated' : 'Created'} financial_credit_report for org ${subjectOrganizationId}, FY${year.fiscalYear} (document ${documentUuid})`,
      );
    }
  }

  private num(value: number | null | undefined): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  private ratio(
    numerator: number | null | undefined,
    denominator: number | null | undefined,
  ): string | null {
    if (
      numerator === null ||
      numerator === undefined ||
      !denominator // null, undefined, or 0
    ) {
      return null;
    }
    return (numerator / denominator).toFixed(4);
  }
}
