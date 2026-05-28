import { IsOptional, IsEnum } from 'class-validator';
import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';

export class GetRiskModelsDto {
  @IsOptional()
  @IsEnum(RiskModelStatusEnum, {
    message: 'riskModelStatus must be one of: PUBLISHED, DRAFT, ARCHIVED',
  })
  riskModelStatus?: RiskModelStatusEnum;
}
