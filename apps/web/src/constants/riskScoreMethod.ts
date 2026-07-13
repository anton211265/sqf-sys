import { RiskFactorScoreMethodEnum } from './enum';

export const riskScoreMethod = [
  { name: 'Numeric Scoring', code: RiskFactorScoreMethodEnum.NUMERIC_SCORING },
  {
    name: 'Label-based Scoring',
    code: RiskFactorScoreMethodEnum.LABEL_SELECTION,
  },
  {
    name: 'Dropdown Selection Scoring',
    code: RiskFactorScoreMethodEnum.DROPDOWN_SELECTION,
  },
  {
    name: 'Country Selection Scoring',
    code: RiskFactorScoreMethodEnum.COUNTRY_SELECTION,
  },
];
