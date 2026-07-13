import { ThresholdBreachTriggerComparisonOperatorEnum } from '@app/common/apps/risk-operation/enums/threshold-breach-trigger-comparison-operator.enum';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { RiskProfile } from '../models/risk-profile.entity';
import { RiskQuantitativeParameter } from '../models/risk-quantitative-parameter.entity';
import { RiskQuantitativeProfileWeight } from '../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeSubParameter } from '../models/risk-quantitative-sub-parameter.entity';
import { RiskQuantitativeThresholdRule } from '../models/risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeParameterRepository } from '../repositories/risk-quantitative-parameter.repository';
import { RiskQuantitativeProfileWeightRepository } from '../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeThresholdRuleRepository } from '../repositories/risk-quantitative-threshold-rule.repository';
import { RiskProfileRepository } from '../repositories/risk-profile.repository';
import { RiskOperationModule } from '../risk-operation.module';

const { GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL } =
  ThresholdBreachTriggerComparisonOperatorEnum;

// Master quantitative parameter categories, sub-parameters, weights, and breach
// thresholds. This is the template every new Risk Profile is duplicated from
// (see RiskProfile.isDefault and the duplicateDefault* service methods).
const DEFAULT_PARAMETERS: {
  name: string;
  weight: number;
  subParameters: {
    name: string;
    weight: number;
    comparisonOperator: ThresholdBreachTriggerComparisonOperatorEnum;
    thresholdValue: number;
    thresholdLabel: string;
  }[];
}[] = [
  {
    name: 'Liquidity',
    weight: 30,
    subParameters: [
      {
        name: 'Current Ratio',
        weight: 50,
        comparisonOperator: GREATER_THAN_OR_EQUAL,
        thresholdValue: 1.5,
        thresholdLabel: 'Minimum acceptable current ratio',
      },
      {
        name: 'Quick Ratio',
        weight: 50,
        comparisonOperator: GREATER_THAN_OR_EQUAL,
        thresholdValue: 1.0,
        thresholdLabel: 'Minimum acceptable quick ratio',
      },
    ],
  },
  {
    name: 'Leverage',
    weight: 25,
    subParameters: [
      {
        name: 'Debt-to-Equity Ratio',
        weight: 50,
        comparisonOperator: LESS_THAN_OR_EQUAL,
        thresholdValue: 2.0,
        thresholdLabel: 'Maximum acceptable debt-to-equity ratio',
      },
      {
        name: 'Gearing Ratio',
        weight: 50,
        comparisonOperator: LESS_THAN_OR_EQUAL,
        thresholdValue: 0.6,
        thresholdLabel: 'Maximum acceptable gearing ratio',
      },
    ],
  },
  {
    name: 'Coverage',
    weight: 15,
    subParameters: [
      {
        name: 'Interest Coverage Ratio',
        weight: 100,
        comparisonOperator: GREATER_THAN_OR_EQUAL,
        thresholdValue: 1.5,
        thresholdLabel: 'Minimum acceptable interest coverage ratio',
      },
    ],
  },
  {
    name: 'Asset Management',
    weight: 15,
    subParameters: [
      {
        name: 'Asset Turnover Ratio',
        weight: 34,
        comparisonOperator: GREATER_THAN_OR_EQUAL,
        thresholdValue: 1.0,
        thresholdLabel: 'Minimum acceptable asset turnover ratio',
      },
      {
        name: 'Debtor Days',
        weight: 33,
        comparisonOperator: LESS_THAN_OR_EQUAL,
        thresholdValue: 90,
        thresholdLabel: 'Maximum acceptable debtor days',
      },
      {
        name: 'Creditor Days',
        weight: 33,
        comparisonOperator: LESS_THAN_OR_EQUAL,
        thresholdValue: 90,
        thresholdLabel: 'Maximum acceptable creditor days',
      },
    ],
  },
  {
    name: 'Business Stability',
    weight: 15,
    subParameters: [
      {
        name: 'Revenue Growth Rate',
        weight: 50,
        comparisonOperator: GREATER_THAN_OR_EQUAL,
        thresholdValue: 0,
        thresholdLabel: 'Minimum acceptable revenue growth rate',
      },
      {
        name: 'Profit Margin Trend',
        weight: 50,
        comparisonOperator: GREATER_THAN_OR_EQUAL,
        thresholdValue: 0,
        thresholdLabel: 'Minimum acceptable profit margin trend',
      },
    ],
  },
];

const DEFAULT_RISK_PROFILE_CODE = 'DEFAULT';

async function bootstrap() {
  const app = await NestFactory.create(RiskOperationModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  const riskProfileRepository = app.get(RiskProfileRepository);
  const riskQuantitativeParameterRepository = app.get(
    RiskQuantitativeParameterRepository,
  );
  const riskQuantitativeProfileWeightRepository = app.get(
    RiskQuantitativeProfileWeightRepository,
  );
  const riskQuantitativeThresholdRuleRepository = app.get(
    RiskQuantitativeThresholdRuleRepository,
  );

  logger.log('Seeding default risk profile and quantitative parameters...');

  const existingDefault = await riskProfileRepository.findOne({
    where: { isDefault: 1 },
  });

  if (existingDefault) {
    logger.log(
      `Default risk profile already exists (${existingDefault.riskProfileCode}) — skipping.`,
    );
    await app.close();
    return;
  }

  // 1 — Create the default Risk Profile (the template new profiles duplicate from)
  const defaultRiskProfile = await riskProfileRepository.save(
    new RiskProfile({
      riskProfileCode: DEFAULT_RISK_PROFILE_CODE,
      businessSector: null,
      businessSectorOther: null,
      capitalSize: null,
      capitalCurrency: null,
      isDefault: 1,
      numberOfActiveProfiles: 0,
      lowRiskThresholds: [0, 30],
      mediumRiskThresholds: [31, 70],
      highRiskThresholds: [71, 100],
    }),
  );
  logger.log(`Created default risk profile (id=${defaultRiskProfile.id}).`);

  // 2 — Create the master parameter/sub-parameter list, plus weights and
  // threshold rules against the default profile.
  for (const param of DEFAULT_PARAMETERS) {
    const savedParameter = await riskQuantitativeParameterRepository.save(
      new RiskQuantitativeParameter({
        name: param.name,
        riskQuantitativeSubParameters: param.subParameters.map(
          (sp) => new RiskQuantitativeSubParameter({ name: sp.name }),
        ),
      }),
    );

    // Parent/category-level weight row — quantitativeSubParameterId is null,
    // representing this parameter's overall weight within the profile.
    // RiskQuantitativeProfileWeightService.findAll() filters on this to
    // build the parameter list; without it the section renders empty.
    await riskQuantitativeProfileWeightRepository.save(
      new RiskQuantitativeProfileWeight({
        riskProfileId: defaultRiskProfile.id,
        quantitativeParameterId: savedParameter.id,
        quantitativeSubParameterId: null,
        weight: param.weight,
      }),
    );

    for (let i = 0; i < param.subParameters.length; i++) {
      const subParamConfig = param.subParameters[i];
      const savedSubParameter = savedParameter.riskQuantitativeSubParameters[i];

      await riskQuantitativeProfileWeightRepository.save(
        new RiskQuantitativeProfileWeight({
          riskProfileId: defaultRiskProfile.id,
          quantitativeParameterId: savedParameter.id,
          quantitativeSubParameterId: savedSubParameter.id,
          weight: subParamConfig.weight,
        }),
      );

      await riskQuantitativeThresholdRuleRepository.save(
        new RiskQuantitativeThresholdRule({
          riskProfileId: defaultRiskProfile.id,
          quantitativeParameterId: savedParameter.id,
          quantitativeSubParameterId: savedSubParameter.id,
          score: 1,
          thresholdValue: subParamConfig.thresholdValue,
          thresholdLabel: subParamConfig.thresholdLabel,
          comparisonOperator: subParamConfig.comparisonOperator,
          isManualTriggerAllowed: 0,
        }),
      );
    }

    logger.log(`Seeded parameter "${param.name}" with ${param.subParameters.length} sub-parameter(s).`);
  }

  logger.log('Default risk profile seed complete.');
  await app.close();
}

bootstrap();
