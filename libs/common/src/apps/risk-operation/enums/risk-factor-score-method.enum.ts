export enum RiskFactorScoreMethodEnum {
  NUMERIC_SCORING = 'NUMERIC_SCORING',
  LABEL_SELECTION = 'LABEL_SELECTION',
  COUNTRY_SELECTION = 'COUNTRY_SELECTION',
  DROPDOWN_SELECTION = 'DROPDOWN_SELECTION',
  // CRC pass 1 (2026-07-24): the four methods from the Risk Model Template
  // spec the legacy build never implemented. Add-only (PG enum values).
  CONDITIONAL_NUMERIC = 'CONDITIONAL_NUMERIC',
  BOOLEAN = 'BOOLEAN',
  DATE_RANGE = 'DATE_RANGE',
  DATE_BASED = 'DATE_BASED',
}
