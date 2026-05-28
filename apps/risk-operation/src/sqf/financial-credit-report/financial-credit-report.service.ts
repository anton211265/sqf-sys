import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { CreateFinancialCreditReportDto } from './dto/create-financial-credit-report.dto';
import { UpdateFinancialCreditReportDto } from './dto/update-financial-credit-report.dto';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { mockFinancialCreditReport } from 'apps/risk-operation/test/mock/financial-credit-report.mock';
import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { Readable } from 'stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import {
  addPrecisionDecimals,
  dividePrecisionDecimals,
} from '@app/common/utils/decimal';
@Injectable()
export class FinancialCreditReportService {
  constructor(
    private readonly financialCreditReportRepository: FinancialCreditReportRepository,
    @Inject('S3Client') private s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async create(organizationId: number) {
    try {
      for (let i = 0; i < 3; i++) {
        const reportDate = new Date();
        reportDate.setFullYear(reportDate.getFullYear() - i);

        const reportData = mockFinancialCreditReport(
          organizationId,
          reportDate,
        );

        const report =
          await this.financialCreditReportRepository.create(reportData);
      }
    } catch (error) {
      console.error(`Error storing financial credit report:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store financial credit report`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      message: `Financial credit report has been stored successfully.`,
      statusCode: HttpStatus.OK,
    };
  }

  findAll() {
    return `This action returns all financialCreditReport`;
  }

  async findOne(id: number) {
    const financialCreditReportData =
      await this.financialCreditReportRepository.find({
        where: {
          organizationId: id,
        },
        order: {
          reportYear: 'DESC',
        },
        take: 3,
      });

    let totalLoanReceivableRatio = '0';
    let totalCurrentRatio = '0';
    let totalDebtToEquityRatio = '0';
    let totalDebtToEbitdaRatio = '0';
    let totalDebtToCapitalRatio = '0';
    let totalRcfToNetDebtRatio = '0';
    let totalEbitdaToInterestExpenseRatio = '0';
    let totalDebtServiceCoverageRatio = '0';

    for (let index = 0; index < financialCreditReportData.length; index++) {
      const element = financialCreditReportData[index];

      totalLoanReceivableRatio = addPrecisionDecimals(
        totalLoanReceivableRatio,
        element['loanToReceivable'],
      );
      totalCurrentRatio = addPrecisionDecimals(
        totalCurrentRatio,
        element['currentRatio'],
      );
      totalDebtToEquityRatio = addPrecisionDecimals(
        totalDebtToEquityRatio,
        element['debtToEquity'],
      );
      totalDebtToEbitdaRatio = addPrecisionDecimals(
        totalDebtToEbitdaRatio,
        element['debtToEbitda'],
      );
      totalDebtToCapitalRatio = addPrecisionDecimals(
        totalDebtToCapitalRatio,
        element['debtToCapital'],
      );
      totalRcfToNetDebtRatio = addPrecisionDecimals(
        totalRcfToNetDebtRatio,
        element['rcfToNetDebt'],
      );
      totalEbitdaToInterestExpenseRatio = addPrecisionDecimals(
        totalEbitdaToInterestExpenseRatio,
        element['ebitdaToInterestExpense'],
      );
      totalDebtServiceCoverageRatio = addPrecisionDecimals(
        totalDebtServiceCoverageRatio,
        element['debtServiceCoverageRatio'],
      );
    }

    // ---------------- Asset Management ----------------

    const loanReceivableRatioInString =
      totalLoanReceivableRatio !== '0'
        ? dividePrecisionDecimals(
            totalLoanReceivableRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const loanReceivableRatio = Number(loanReceivableRatioInString);

    const LoanReceivableRiskRules = [
      {
        condition: (value: number) => value > 1.0,
        category: RiskCategoryEnum.HIGH,
        description: 'Loans exceed Receivables',
      },
      {
        condition: (value: number) => value >= 0.75 && value <= 1.0,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Manageable but needs monitoring',
      },
      {
        condition: (value: number) => value < 0.75,
        category: RiskCategoryEnum.LOW,
        description: 'Strong asset management',
      },
    ];

    const matchedLoanReceivableRatioRule = LoanReceivableRiskRules.find(
      (rule) => rule.condition(loanReceivableRatio),
    )!;

    const assetManagementList = [
      {
        loanReceivableRatio: loanReceivableRatioInString,
        category: matchedLoanReceivableRatioRule.category,
        description: matchedLoanReceivableRatioRule.description,
      },
    ];

    // ---------------- Asset Management ----------------

    // ---------------- Liquidity Measures ----------------

    const currentRatioInString =
      totalCurrentRatio !== '0'
        ? dividePrecisionDecimals(
            totalCurrentRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const currentRatio = Number(currentRatioInString);

    const currentRatioRules = [
      {
        condition: (value: number) => value < 1.0,
        category: RiskCategoryEnum.HIGH,
        description: 'Liquidity Shortage',
      },
      {
        condition: (value: number) => value >= 1.0 && value <= 1.5,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Manageable but tight liquidity',
      },
      {
        condition: (value: number) => value > 1.5,
        category: RiskCategoryEnum.LOW,
        description: 'Strong Liquidity Position',
      },
    ];

    const matchedCurrentRatioRule = currentRatioRules.find((rule) =>
      rule.condition(currentRatio),
    )!;

    const liquidityMeasuresList = [
      {
        currentRatio: currentRatioInString,
        category: matchedCurrentRatioRule.category,
        description: matchedCurrentRatioRule.description,
      },
    ];

    // ---------------- Liquidity Measures ----------------

    // ---------------- Leverage ----------------

    // ---------------------------------- Debt to Equity ----------------------------------

    const debtToEquityRatioInString =
      totalDebtToEquityRatio !== '0'
        ? dividePrecisionDecimals(
            totalDebtToEquityRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const debtToEquityRatio = Number(currentRatioInString);

    const debtToEquityRules = [
      {
        condition: (value: number) => value > 2.0,
        category: RiskCategoryEnum.HIGH,
        description: 'Excessive debt reliance',
      },
      {
        condition: (value: number) => value >= 1.0 && value <= 2.0,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Balanced but needs monitoring',
      },
      {
        condition: (value: number) => value < 1.0,
        category: RiskCategoryEnum.LOW,
        description: 'Strong equity position',
      },
    ];

    const matchedDebtToEquityRatioRule = debtToEquityRules.find((rule) =>
      rule.condition(debtToEquityRatio),
    )!;

    // ---------------------------------- Debt to Equity ----------------------------------

    // ---------------------------------- Debt to Ebitda ----------------------------------

    const debtToEbitdaRatioInString =
      totalDebtToEbitdaRatio !== '0'
        ? dividePrecisionDecimals(
            totalDebtToEbitdaRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const debtToEbitdaRatio = Number(debtToEbitdaRatioInString);

    const debtToEbitdaRules = [
      {
        condition: (value: number) => value > 5.0,
        category: RiskCategoryEnum.HIGH,
        description: 'Struggles to cover debt',
      },
      {
        condition: (value: number) => value >= 3.0 && value <= 5.0,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Manageable, but watch cash flow',
      },
      {
        condition: (value: number) => value < 3.0,
        category: RiskCategoryEnum.LOW,
        description: 'Strong earnings support debt repayment',
      },
    ];

    const matchedDebtToEbitdaRatioRule = debtToEbitdaRules.find((rule) =>
      rule.condition(debtToEbitdaRatio),
    )!;

    // ---------------------------------- Debt to Ebitda ----------------------------------

    // ---------------------------------- Debt to Capital ----------------------------------

    const debtToCapitalRatioInString =
      totalDebtToCapitalRatio !== '0'
        ? dividePrecisionDecimals(
            totalDebtToCapitalRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const debtToCapitalRatio = Number(debtToCapitalRatioInString);

    const debtToCapitalRules = [
      {
        condition: (value: number) => value > 0.6,
        category: RiskCategoryEnum.HIGH,
        description: 'High reliance on debt financing',
      },
      {
        condition: (value: number) => value >= 0.4 && value <= 0.6,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Balanced but needs monitoring',
      },
      {
        condition: (value: number) => value < 0.4,
        category: RiskCategoryEnum.LOW,
        description: 'Strong equity base',
      },
    ];

    const matchedDebtToCapitalRatioRule = debtToCapitalRules.find((rule) =>
      rule.condition(debtToCapitalRatio),
    )!;

    // ---------------------------------- Debt to Capital ----------------------------------

    // ---------------------------------- RCF/Net Debt ----------------------------------

    const rcfToNetDebtRatioInString =
      totalRcfToNetDebtRatio !== '0'
        ? dividePrecisionDecimals(
            totalRcfToNetDebtRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const rcfToNetDebtRatio = Number(rcfToNetDebtRatioInString);

    const rcfToNetDebtRules = [
      {
        condition: (value: number) => value < 20,
        category: RiskCategoryEnum.HIGH,
        description: 'Low liquidity buffer',
      },
      {
        condition: (value: number) => value >= 20 && value <= 40,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Manageable but needs monitoring',
      },
      {
        condition: (value: number) => value > 40,
        category: RiskCategoryEnum.LOW,
        description: 'Strong liquidity to cover debt',
      },
    ];

    const matchedRcfToNetDebtRule = rcfToNetDebtRules.find((rule) =>
      rule.condition(rcfToNetDebtRatio),
    )!;

    // ---------------------------------- RCF/Net Debt ----------------------------------

    const leverageList = [
      {
        debtToEquityRatio: debtToEquityRatioInString,
        category: matchedDebtToEquityRatioRule.category,
        description: matchedDebtToEquityRatioRule.description,
      },
      {
        debtToEbitdaRatio: debtToEbitdaRatioInString,
        category: matchedDebtToEbitdaRatioRule.category,
        description: matchedDebtToEbitdaRatioRule.description,
      },
      {
        debtToCapitalRatio: debtToCapitalRatioInString,
        category: matchedDebtToCapitalRatioRule.category,
        description: matchedDebtToCapitalRatioRule.description,
      },
      {
        rcfToNetDebtRatio: rcfToNetDebtRatioInString,
        category: matchedRcfToNetDebtRule.category,
        description: matchedRcfToNetDebtRule.description,
      },
    ];

    // ---------------- Leverage ----------------

    // ---------------- Coverage ----------------

    // ---------------------------------- Ebitda/Interest Expense ----------------------------------

    const ebitdaToInterestExpenseRatioInString =
      totalEbitdaToInterestExpenseRatio !== '0'
        ? dividePrecisionDecimals(
            totalEbitdaToInterestExpenseRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const ebitdaToInterestExpenseRatio = Number(
      ebitdaToInterestExpenseRatioInString,
    );

    const ebitdaToInterestExpenseRules = [
      {
        condition: (value: number) => value < 2.0,
        category: RiskCategoryEnum.HIGH,
        description: 'Struggles to meet interest payments',
      },
      {
        condition: (value: number) => value >= 2.0 && value <= 4.0,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Limited cushion, manageable but needs monitoring',
      },
      {
        condition: (value: number) => value > 4.0,
        category: RiskCategoryEnum.LOW,
        description: 'Strong coverage, financially stable',
      },
    ];

    const matchedEbitdaToInterestExpenseRatioRule =
      ebitdaToInterestExpenseRules.find((rule) =>
        rule.condition(ebitdaToInterestExpenseRatio),
      )!;

    // ---------------------------------- Ebitda/Interest Expense ----------------------------------

    // ---------------------------------- DSCR ----------------------------------

    const debtServiceCoverageRatioInString =
      totalDebtServiceCoverageRatio !== '0'
        ? dividePrecisionDecimals(
            totalDebtServiceCoverageRatio,
            financialCreditReportData.length.toString(),
          )
        : 0;

    const debtServiceCoverageRatio = Number(debtServiceCoverageRatioInString);

    const debtServiceCoverageRules = [
      {
        condition: (value: number) => value < 1.0,
        category: RiskCategoryEnum.HIGH,
        description: 'Insufficient earnings to cover debt payments',
      },
      {
        condition: (value: number) => value >= 1.0 && value <= 1.5,
        category: RiskCategoryEnum.MEDIUM,
        description: 'Tight coverage, may struggle under financial stress',
      },
      {
        condition: (value: number) => value > 1.5,
        category: RiskCategoryEnum.LOW,
        description: 'Comfortable debt coverage',
      },
    ];

    const matchedDebtServiceCoverageRatioRule = debtServiceCoverageRules.find(
      (rule) => rule.condition(debtServiceCoverageRatio),
    )!;

    // ---------------------------------- DSCR ----------------------------------

    const coverageList = [
      {
        ebitdaToInterestExpenseRatio: ebitdaToInterestExpenseRatioInString,
        category: matchedEbitdaToInterestExpenseRatioRule.category,
        description: matchedEbitdaToInterestExpenseRatioRule.description,
      },
      {
        debtServiceCoverageRatio: debtServiceCoverageRatioInString,
        category: matchedDebtServiceCoverageRatioRule.category,
        description: matchedDebtServiceCoverageRatioRule.description,
      },
    ];

    // ---------------- Coverage ----------------

    return {
      assetManagement: assetManagementList,
      liquidityMeasures: liquidityMeasuresList,
      leverage: leverageList,
      coverage: coverageList,
      financialCreditReport: financialCreditReportData,
    };
  }

  update(
    id: number,
    updateFinancialCreditReportDto: UpdateFinancialCreditReportDto,
  ) {
    return `This action updates a #${id} financialCreditReport`;
  }

  remove(id: number) {
    return `This action removes a #${id} financialCreditReport`;
  }

  async getFileStream(path: string): Promise<Readable | null> {
    // use // becuase even though we pass as \\ it will be converted to //...
    const parts = path.split('//');
    const extractedBucket = parts[0];
    // Join them back in case the path contains more backslashes
    const extractedPath = parts.slice(1).join('//');

    try {
      const command = new GetObjectCommand({
        Bucket: extractedBucket,
        Key: extractedPath,
      });

      const response = await this.s3Client.send(command);

      return response.Body as Readable;
    } catch (error) {
      return null;
    }
  }
}
