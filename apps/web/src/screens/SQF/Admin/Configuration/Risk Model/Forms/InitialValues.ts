import { RiskFactorScoreMethodEnum } from 'constants/enum';

export interface createNewRiskModel {
  riskModelName: string;
  description: string;
}

export const createNewARiskModelInitialValues: createNewRiskModel = {
  riskModelName: '',
  description: '',
};

export interface createNewThresholdProfile {
  businessSector: string;
  businessSectorOther?: string;
  capitalSize: string;
  currency: string;
}

export const createNewThresholdProfileInitialValues: createNewThresholdProfile =
  {
    businessSector: '',
    capitalSize: '',
    currency: '',
  };

export interface createNewRiskFactor {
  riskFactorName: string;
  description?: string;
  weight: number;
  isSetAsCategory: boolean;
  hasSubFactor: boolean;
  tabName?: string;
  scoreMethod?: RiskFactorScoreMethodEnum;
  isRequireEvaluationParameter: boolean;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  subFactors?: createNewRiskFactor[];
  evaluationParameters?: any[];
}

export const createNewRiskFactorInitialValues: createNewRiskFactor = {
  riskFactorName: '',
  weight: 0,
  isSetAsCategory: true,
  hasSubFactor: false,
  tabName: '',
  description: undefined,
  scoreRangeMin: undefined,
  scoreRangeMax: undefined,
  subFactors: [],
  isRequireEvaluationParameter: false,
  evaluationParameters: [],
};
