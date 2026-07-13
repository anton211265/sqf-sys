import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskQuantitativeProfileScoringDto } from './dto/create-risk-quantitative-profile-scoring.dto';
import { UpdateRiskQuantitativeProfileScoringDto } from './dto/update-risk-quantitative-profile-scoring.dto';
import { RiskQuantitativeProfileScoringRepository } from '../../repositories/risk-quantitative-profile-scoring.repository';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { IsNull } from 'typeorm';
import { RiskProfile } from '../../models/risk-profile.entity';
import { FinancialCreditReportService } from '../financial-credit-report/financial-credit-report.service';
import { RiskProfileService } from '../risk-profile/risk-profile.service';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskQuantitativeProfileScoring } from '../../models/risk-quantitative-profile-scoring.entity';
import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';

@Injectable()
export class RiskQuantitativeProfileScoringService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly riskQuantitativeProfileScoringRepository: RiskQuantitativeProfileScoringRepository,
    private readonly riskApplicationScoringRepository: RiskApplicationScoringRepository,
    private readonly financialCreditReportService: FinancialCreditReportService,
    private readonly riskProfileService: RiskProfileService,
    private readonly riskProfileRepository: RiskProfileRepository,
  ) {}

  async create(applicationNumber: string) {
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

    // Get riskApplicationScoringId
    const riskApplicationScoringId = riskApplicationScoring.id;

    const organizationId = getApplication.organizationId;

    const riskProfile = getApplication.riskApplicationScoring?.riskProfile;

    if (!riskApplicationScoringId || !riskProfile.riskProfileCode) {
      throw new NotFoundException(
        `riskApplicationScoringId or riskProfileCode not found for application: ${applicationNumber}`,
      );
    }

    // Get financial credit report by organizationId
    const financialCreditReport =
      await this.financialCreditReportService.findOne(organizationId);

    // List of parameters to evaluate
    const parameterNames = [
      'Business Stability',
      'Asset Management',
      'Liquidity Measures',
      'Leverage',
      'Coverage',
    ];

    // Loop the parameterNames to evaluate scoring logic one by one
    for (const paramName of parameterNames) {
      await this.evaluateFinancialCreditReportAndGiveScore({
        riskProfileCode: riskProfile.riskProfileCode,
        parameterName: paramName,
        creditReportData: financialCreditReport,
        riskApplicationScoringId,
      });
    }

    // Get all risk quantitative parameters, ensure all parameter scores are complete
    const getAllParameters =
      await this.riskQuantitativeProfileScoringRepository.find({
        where: {
          riskApplicationScoringId: riskApplicationScoringId,
          quantitativeSubParameterId: IsNull(),
        },
      });

    if (!getAllParameters.length) {
      throw new NotFoundException(
        'No risk quantitative parameter found for scoring.',
      );
    }

    const incompleteParameterScoring = getAllParameters.filter(
      (p) => p.weightedScore === null,
    );

    if (incompleteParameterScoring.length > 0) {
      throw new BadRequestException(
        `Cannot finalise score for risk filter 1 scoring.`,
      );
    }

    // Get sum of parameter's weighted score
    const totalWeightedScore = getAllParameters.reduce(
      (sum, param) => sum + Number(param.weightedScore || 0),
      0,
    );

    // Get numrange for risk threshold
    const lowRange: [number, number] = riskProfile.lowRiskThresholds;
    const mediumRange: [number, number] = riskProfile.mediumRiskThresholds;
    const highRange: [number, number] = riskProfile.highRiskThresholds;

    let riskCategory = null;

    if (
      totalWeightedScore >= lowRange[0] &&
      totalWeightedScore <= lowRange[1]
    ) {
      riskCategory = RiskCategoryEnum.LOW;
    } else if (
      totalWeightedScore >= mediumRange[0] &&
      totalWeightedScore <= mediumRange[1]
    ) {
      riskCategory = RiskCategoryEnum.MEDIUM;
    } else if (
      totalWeightedScore >= highRange[0] &&
      totalWeightedScore <= highRange[1]
    ) {
      riskCategory = RiskCategoryEnum.HIGH;
    }

    riskApplicationScoring.riskFilter1TotalScore = totalWeightedScore;
    riskApplicationScoring.riskFilter1Category = riskCategory;
    riskApplicationScoring.riskFilter1UpdatedAt = new Date();

    await this.riskApplicationScoringRepository.save(riskApplicationScoring);

    return {
      message: `Risk Profile Scoring completed for applicationNumber: ${applicationNumber}`,
      statusCode: 201,
    };
  }

  async evaluateFinancialCreditReportAndGiveScore({
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
    // Get threshold rules data (parameter + sub-parameters + rules) of the assigned risk profile in riskApplicationScoring
    const { data: thresholdData } =
      await this.riskProfileService.getRiskProfileParametersByName(
        riskProfileCode,
        parameterName,
      );

    let totalScore = 0;

    // Track total weighted score for the parameter
    let totalWeightedScore = 0;

    // Insert entry for parameter
    const newParameterScoring = new RiskQuantitativeProfileScoring({
      riskApplicationScoringId,
      quantitativeParameterId: thresholdData.parameterId,
      quantitativeParameterName: thresholdData.parameterName,
      weight: thresholdData.weight,
    });

    const savedParameterScoring =
      await this.riskQuantitativeProfileScoringRepository.save(
        newParameterScoring,
      );

    // Loop through each sub-parameter under current evaluate parameter
    for (const sub of thresholdData.subParameters) {
      // Get value from financial credit report of the sub parameter to be evaluated
      const actualData = this.getValueFromCreditReport(
        parameterName,
        sub.subParameterName,
        creditReportData,
      );


      // Skip if data from financial credit report not found
      if (actualData === null || actualData === undefined) {
        continue;
      }

      // Find matching rule (either numeric or label-based match)
      let matchedRule = null;

      if (sub.subParameterName === 'Profitability') {
        // For string-based matching (like LLL, LLP, etc)
        matchedRule = sub.rules.find((rule) => {
          const match = rule.thresholdLabel === actualData;

          return match;
        });
      } else {
        // For numeric-based matching (years, ratios, etc)
        matchedRule = sub.rules.find((rule) => {
          const match = this.compare(
            Number(actualData),
            rule.thresholdValue,
            rule.comparisonOperator,
          );

          return match;
        });
      }

      // Skip if no rule matched
      if (!matchedRule) {

        // Insert entry with score 0
        const fallbackSubParameterScoring = new RiskQuantitativeProfileScoring({
          riskApplicationScoringId,
          quantitativeParameterId: thresholdData.parameterId,
          quantitativeParameterName: thresholdData.parameterName,
          quantitativeSubParameterId: sub.subParameterId,
          quantitativeSubParameterName: sub.subParameterName,
          thresholdRuleId: null,
          valueNumeric:
            sub.subParameterName === 'Profitability'
              ? null
              : Number(actualData),
          valueLabel:
            sub.subParameterName === 'Profitability'
              ? String(actualData)
              : null,
          score: 0,
          weight: sub.weight,
          weightedScore: 0,
        });

        await this.riskQuantitativeProfileScoringRepository.save(
          fallbackSubParameterScoring,
        );

        continue;
      }

      // Cap score to max 10
      // This will take the min between matchedRule.score and 10
      const score = Math.min(matchedRule.score, 10); // cap score at 10
      const minScore = 0; // minimum score is 0
      const maxScore = 10; // max score is 10

      const scorePercent = ((score - minScore) / (maxScore - minScore)) * 100;

      const weightedScore = (scorePercent * sub.weight) / 100;

      totalScore += score;
      totalWeightedScore += weightedScore;

      // Insert entry for subparameters
      const newSubParameterScoring = new RiskQuantitativeProfileScoring({
        riskApplicationScoringId,
        quantitativeParameterId: thresholdData.parameterId,
        quantitativeParameterName: thresholdData.parameterName,
        quantitativeSubParameterId: sub.subParameterId,
        quantitativeSubParameterName: sub.subParameterName,
        thresholdRuleId: matchedRule.ruleId,
        valueNumeric:
          sub.subParameterName === 'Profitability' ? null : Number(actualData),
        valueLabel:
          sub.subParameterName === 'Profitability' ? String(actualData) : null,
        score,
        weight: sub.weight,
        weightedScore,
      });

      await this.riskQuantitativeProfileScoringRepository.save(
        newSubParameterScoring,
      );
    }

    savedParameterScoring.score = totalScore;
    savedParameterScoring.weightedScore = totalWeightedScore;

    await this.riskQuantitativeProfileScoringRepository.save(
      savedParameterScoring,
    );
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
      return null;
    }

    const [sectionName, fieldName] = entry;

    // Special case for "financialCreditReport", which is not nested in an array
    if (sectionName === 'financialCreditReport') {
      const value = creditReport?.[sectionName]?.[0]?.[fieldName];

      if (value === undefined || value === null) {
        return null;
      }

      // If it's Profitability, return it directly as string
      if (subParameterName === 'Profitability') {

        return String(value);
      }

      const numeric = Number(value);

      if (isNaN(numeric)) {
        return null;
      }

      return numeric;
    }

    // Search the entire array to find the first object with the field
    const sectionArray = creditReport?.[sectionName];

    if (!Array.isArray(sectionArray)) {
      return null;
    }

    const matchedEntry = sectionArray.find(
      (item) => item?.[fieldName] !== undefined,
    );

    if (!matchedEntry) {
      return null;
    }

    const rawValue = matchedEntry[fieldName];

    const numeric = Number(rawValue);

    if (isNaN(numeric)) {

      return null;
    }

    // Return the number value

    return numeric;
  }

  compare(actual: number, expected: number, operator: string): boolean {
    // Check for nulls to prevent runtime errors
    if (expected === null || actual === null) {
      return false;
    }

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

  findAll() {
    return `This action returns all riskQuantitativeProfileScoring`;
  }

  async findOne(applicationNumber: string) {
    // Get application entity
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
      relations: ['riskApplicationScoring'],
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = getApplication.riskApplicationScoring;

    if (!riskApplicationScoring) {
      throw new NotFoundException(
        `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
      );
    }

    if (riskApplicationScoring.riskProfileId === null) {
      throw new NotFoundException(
        `riskProfileId not found in riskApplicationScoring for applicationNumber: ${applicationNumber}.`,
      );
    }

    try {
      // Get riskQuantitativeProfileScoring
      const getRiskQuantitativeProfileScoring =
        await this.riskQuantitativeProfileScoringRepository.find({
          where: {
            riskApplicationScoringId: riskApplicationScoring.id,
            quantitativeSubParameterId: IsNull(),
          },
        });

      if (!getRiskQuantitativeProfileScoring.length) {
        throw new NotFoundException(
          'No risk quantitative parameters found in risk_quantitative_profile_scoring.',
        );
      }

      const formattedRiskQuantitativeProfileScoring =
        getRiskQuantitativeProfileScoring.map((param) => ({
          parameterId: param.quantitativeParameterId,
          parameterName: param.quantitativeParameterName,
          weight: param.weight ?? null,
          weightedScore: param.weightedScore ?? null,
        }));

      return {
        message:
          'Scores for risk quantitative parameters retrieved successfully.',
        statusCode: HttpStatus.OK,
        data: {
          applicationNumber: applicationNumber,
          riskApplicationScoringId: riskApplicationScoring.id,
          riskProfileId: riskApplicationScoring.riskProfileId,
          quantitativeParameters: formattedRiskQuantitativeProfileScoring,
        },
      };
    } catch (error) {
      console.error(
        `Error to fetch scores for risk quantitative parameters for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error to fetch scores for risk quantitative parameters for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(
    id: number,
    updateRiskQuantitativeProfileScoringDto: UpdateRiskQuantitativeProfileScoringDto,
  ) {
    return `This action updates a #${id} riskQuantitativeProfileScoring`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskQuantitativeProfileScoring`;
  }
}
