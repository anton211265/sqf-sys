import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskManualReviewAlertDto } from './dto/create-risk-manual-review-alert.dto';
import { UpdateRiskManualReviewAlertDto } from './dto/update-risk-manual-review-alert.dto';
import { ApplicationRepository } from '../../repositories/application.repository';
import { FinancialCreditReportService } from '../financial-credit-report/financial-credit-report.service';
import { RiskQuantitativeThresholdRuleService } from '../risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.service';
import { RiskProfileService } from '../risk-profile/risk-profile.service';
import { RiskManualReviewAlertRepository } from '../../repositories/risk-manual-review-alert.repository';
import { RiskManualReviewAlert } from '../../models/risk-manual-review-alert.entity';
import { ThresholdBreachTriggerComparisonOperatorEnum } from '@app/common/apps/risk-operation/enums/threshold-breach-trigger-comparison-operator.enum';
import { RiskFilter1StatusEnum } from '@app/common/apps/risk-operation/enums/risk-filter-1-status.enum';
import { RiskApplicationAuditLogService } from '../risk-application-audit-log/risk-application-audit-log.service';
import { RiskApplicationAuditActionEnum } from '@app/common/apps/risk-operation/enums/risk-application-audit-action.enum';

@Injectable()
export class RiskManualReviewAlertService {
  constructor(
    private readonly riskManualReviewAlertRepository: RiskManualReviewAlertRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly financialCreditReportService: FinancialCreditReportService,
    private readonly riskQuantitativeThresholdRuleService: RiskQuantitativeThresholdRuleService,
    private readonly riskProfileService: RiskProfileService,
    private readonly riskApplicationAuditLogService: RiskApplicationAuditLogService,
  ) {}

  create(createRiskManualReviewAlertDto: CreateRiskManualReviewAlertDto) {
    return 'This action adds a new riskManualReviewAlert';
  }

  async findAll(applicationNumber: string) {
    // Get application entity
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
      relations: [
        'riskApplicationScoring',
        'riskApplicationScoring.riskProfile',
      ],
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = getApplication.riskApplicationScoring;

    try {
      // Get list of manual review alerts
      const getManualReviewAlerts =
        await this.riskManualReviewAlertRepository.find({
          where: {
            riskApplicationScoringId: riskApplicationScoring.id,
            isResolved: 0, // Get all unresolved alerts
          },
          relations: ['quantitativeParameter'],
          order: {
            createdAt: 'DESC',
          },
        });

      // If no alerts, just return empty array
      if (!getManualReviewAlerts.length) {
        return {
          message: `No manual review alerts found for applicationNumber: ${applicationNumber}.`,
          statusCode: HttpStatus.OK,
          data: [],
        };
      }

      const formattedData = getManualReviewAlerts.length
        ? getManualReviewAlerts.map((alert) => ({
            id: alert.id,
            quantitativeParameterName:
              alert.quantitativeParameter?.name ?? null,
            message: alert.message,
          }))
        : [];

      return {
        message: `Risk Manual Review Alerts for applicationNumber: ${applicationNumber} has been retrieve successfully.`,
        statusCode: HttpStatus.OK,
        data: formattedData,
      };
    } catch (error) {
      console.error(
        `Error retrieving riskManualReviewalerts for applicationNumber: ${applicationNumber}:`,
        error,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve riskManualReviewalerts for applicationNumber: ${applicationNumber}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateThresholdBreachAlerts(applicationNumber: string) {
    try {
      // Get application entity
      const getApplication = await this.applicationRepository.findOne({
        where: { applicationNumber: applicationNumber },
        relations: [
          'riskApplicationScoring',
          'riskApplicationScoring.riskProfile',
        ],
      });

      if (!getApplication) {
        throw new NotFoundException(
          `Application with applicationNumber: ${applicationNumber} not found.`,
        );
      }

      const riskApplicationScoringId =
        getApplication.riskApplicationScoring?.id;
      const organizationId = getApplication.organizationId;

      // Get riskProfileCode assigned to the application scoring
      const riskProfileCode =
        getApplication.riskApplicationScoring?.riskProfile?.riskProfileCode;

      if (!riskProfileCode || !riskApplicationScoringId) {
        throw new NotFoundException(
          `Risk profile or scoring not found for applicationNumber: ${applicationNumber}.`,
        );
      }

      // Get financial credit report by organizationId
      const financialCreditReport =
        await this.financialCreditReportService.findOne(organizationId);

      // Parameters to evaluate
      const parameterNames = [
        'Business Stability',
        'Asset Management',
        'Liquidity Measures',
        'Leverage',
        'Coverage',
      ];

      // Loop the parameterNames to evaluate one by one
      for (const paramName of parameterNames) {
        await this.checkThresholdAndInsertAlerts({
          riskProfileCode,
          parameterName: paramName,
          creditReportData: financialCreditReport,
          riskApplicationScoringId,
        });
      }

      return {
        message: `Threshold breach alerts generated successfully for applicationNumber: ${applicationNumber}.`,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.error(
        `Error to generate threshold breach alerts for applicationNumber: ${applicationNumber}:`,
        error,
      );
      throw error;
    }
  }

  async checkThresholdAndInsertAlerts({
    riskProfileCode,
    parameterName,
    creditReportData,
    riskApplicationScoringId,
  }: {
    riskProfileCode: string;
    parameterName: string;
    creditReportData: any;
    riskApplicationScoringId: number;
  }) {
    // Get list of thresholdRules by parameterName
    const { data: thresholdData } =
      await this.riskProfileService.getRiskProfileParametersByName(
        riskProfileCode,
        parameterName,
      );

    const alerts = [];

    for (const sub of thresholdData.subParameters) {
      const actualData = this.getValueFromCreditReport(
        parameterName,
        sub.subParameterName,
        creditReportData,
      );

      console.log(`[${parameterName}] Sub-Param: ${sub.subParameterName}`);
      console.log(`  ↳ Actual value: ${actualData}\n`);

      if (actualData === null || actualData === undefined) {
        console.log(`  ⚠️ Skipped: No data found in credit report.\n`);
        continue;
      }

      if (!sub.rules?.length) {
        console.log(`  ⚠️ No rules found. Skipping.\n`);
        continue;
      }

      for (const rule of sub.rules) {
        const isProfitability = sub.subParameterName === 'Profitability';

        // --------- Logic for proitability (need to handle string match) ---------
        if (isProfitability) {
          if (!rule.thresholdLabel) continue;

          const matched = String(actualData) === rule.thresholdLabel;
          console.log(
            `  🧪 Comparing [score: ${rule.score}]: ${actualData} = ${rule.thresholdLabel} → match = ${matched}`,
          );

          if (!rule.isManualTriggerAllowed) {
            console.log(
              `      ⛔ Rule skipped [score: ${rule.score}]: manual trigger not allowed\n`,
            );
            continue;
          }

          if (matched) {
            console.log(`      ✅ Match found → saving alert to DB\n`);

            const newManualReviewAlerts = new RiskManualReviewAlert({
              riskApplicationScoringId,
              quantitativeParameterId: thresholdData.parameterId,
              quantitativeSubParameterId: sub.subParameterId,
              thresholdRuleId: rule.ruleId,
              actualValueNumeric: null,
              actualValueLabel: String(actualData),
              message: `${sub.subParameterName} ${this.operatorToSymbol(
                rule.comparisonOperator,
              )} ${rule.thresholdLabel}`,
              isResolved: 0, // set to not resolved (false) by default
            });

            await this.riskManualReviewAlertRepository.save(
              newManualReviewAlerts,
            );
          }

          continue; // skip rest of numeric logic
        }

        // --------- Logic for numeric (need to handle numeric match) ---------
        const matched = this.compare(
          Number(actualData),
          rule.thresholdValue,
          rule.comparisonOperator,
        );

        console.log(
          `  🧪 Comparing [score: ${rule.score}]: ${actualData} ${rule.comparisonOperator} ${rule.thresholdValue} → match = ${matched}`,
        );

        if (!rule.isManualTriggerAllowed) {
          console.log(`      ⛔ Rule skipped : manual trigger not allowed\n`);
          continue;
        }

        if (matched) {
          console.log(`      ✅ Match found → saving alert to DB\n`);

          const newManualReviewAlerts = new RiskManualReviewAlert({
            riskApplicationScoringId,
            quantitativeParameterId: thresholdData.parameterId,
            quantitativeSubParameterId: sub.subParameterId,
            thresholdRuleId: rule.ruleId,
            actualValueNumeric: Number(actualData),
            actualValueLabel: null, // no label for numeric
            message: `${sub.subParameterName} ${this.operatorToSymbol(
              rule.comparisonOperator,
            )} ${rule.thresholdValue}`,
            isResolved: 0, // set to not resolved (false) by default
          });

          await this.riskManualReviewAlertRepository.save(
            newManualReviewAlerts,
          );
        }
      }
    }
  }

  getValueFromCreditReport(
    parameter: string,
    subParameterName: string,
    creditReport: any,
  ): number | string | null {
    // This map tells us where to find each sub-parameter value in the credit report
    const lookup = {
      'Years of Operation': ['financialCreditReport', 'yearsOfOperation'],
      'Profitability': ['financialCreditReport', 'profitability'],
      'Loans/Accounts Receivable': ['assetManagement', 'loanReceivableRatio'],
      'Current Ratio': ['liquidityMeasures', 'currentRatio'],
      'Debt/Equity': ['leverage', 'debtToEquityRatio'],
      'Debt/EBITDA': ['leverage', 'debtToEbitdaRatio'],
      'Debt/Capital': ['leverage', 'debtToCapitalRatio'],
      'RCF/Net Debt': ['leverage', 'rcfToNetDebtRatio'],
      'EBITDA/Interest Expense': ['coverage', 'ebitdaToInterestExpenseRatio'],
      'Debt Service Coverage Ratio (DSCR)': [
        'coverage',
        'debtServiceCoverageRatio',
      ],
    };

    // Find the section name and field name from the map
    const entry = lookup[subParameterName];

    if (!entry) {
      console.log(`Lookup not found for subParameterName: ${subParameterName}`);
      return null;
    }

    const [sectionName, fieldName] = entry;

    // Special case for "financialCreditReport", which is not nested in an array
    if (sectionName === 'financialCreditReport') {
      const value = creditReport?.[sectionName]?.[0]?.[fieldName];

      if (value === undefined || value === null) {
        console.log(`Field '${fieldName}' not found in ${sectionName}`);
        return null;
      }

      // If it's Profitability, return it directly as string
      if (subParameterName === 'Profitability') {
        console.log(`✅ Found string value: ${value} for ${subParameterName}`);

        return String(value);
      }

      const numeric = Number(value);

      if (isNaN(numeric)) {
        console.log(`Value for ${fieldName} is not a valid number:`, value);
        return null;
      }

      console.log(`✅ Found value: ${numeric} for ${subParameterName}`);

      return numeric;
    }

    // Search the entire array to find the first object with the field
    const sectionArray = creditReport?.[sectionName];

    if (!Array.isArray(sectionArray)) {
      console.log(`Section '${sectionName}' is not a valid array`);
      return null;
    }

    const matchedEntry = sectionArray.find(
      (item) => item?.[fieldName] !== undefined,
    );

    if (!matchedEntry) {
      console.log(
        `Field '${fieldName}' not found in any entry of '${sectionName}'`,
      );
      return null;
    }

    const rawValue = matchedEntry[fieldName];

    const numeric = Number(rawValue);

    if (isNaN(numeric)) {
      console.log(
        `Field '${fieldName}' in '${sectionName}' is not a valid number:`,
        rawValue,
      );

      return null;
    }

    // Return the number value
    console.log(`✅ Found value: ${numeric} for ${subParameterName}`);

    return numeric;
  }

  compare(actual: number, expected: number, operator: string): boolean {
    if (expected === null || actual === null) return false;

    switch (operator) {
      case '<':
        return actual < expected;
      case '=':
        return actual === expected;
      case '>':
        return actual > expected;
      default:
        return false;
    }
  }

  operatorToSymbol(
    operator: ThresholdBreachTriggerComparisonOperatorEnum,
  ): string {
    switch (operator) {
      case ThresholdBreachTriggerComparisonOperatorEnum.LESS_THAN:
        return '<';
      case ThresholdBreachTriggerComparisonOperatorEnum.LESS_THAN_OR_EQUAL:
        return '≤';
      case ThresholdBreachTriggerComparisonOperatorEnum.GREATER_THAN:
        return '>';
      case ThresholdBreachTriggerComparisonOperatorEnum.GREATER_THAN_OR_EQUAL:
        return '≥';
      case ThresholdBreachTriggerComparisonOperatorEnum.EQUAL:
      default:
        return '=';
    }
  }

  async regenerateThresholdBreachAlerts(applicationNumber: string) {
    // Get application entity
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
      relations: [
        'riskApplicationScoring',
        'riskApplicationScoring.riskProfile',
      ],
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    const riskApplicationScoring = getApplication.riskApplicationScoring;
    const riskApplicationScoringId = getApplication.riskApplicationScoring?.id;

    try {
      // Delete all current risk manual review alerts
      await this.riskManualReviewAlertRepository.delete({
        riskApplicationScoringId: riskApplicationScoringId,
        isResolved: 0,
      });

      // Generate new risk manual review alerts
      await this.generateThresholdBreachAlerts(applicationNumber);

      await this.riskApplicationAuditLogService.create({
        applicationNumber,
        performedBy: 'John Doe (Analyst)',
        actionType: RiskApplicationAuditActionEnum.SCORE_RECALCULATED,
      });

      return {
        message: `Manual review alerts regenerated successfully for applicationNumber: ${applicationNumber}.`,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.error(
        `Error regenerating manual review alerts for applicationNumber: ${applicationNumber}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to regenerate manual review alerts for applicationNumber: ${applicationNumber}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} riskManualReviewAlert`;
  }

  update(
    id: number,
    updateRiskManualReviewAlertDto: UpdateRiskManualReviewAlertDto,
  ) {
    return `This action updates a #${id} riskManualReviewAlert`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskManualReviewAlert`;
  }
}
