import { RiskFilter1StatusEnum } from '@app/common/apps/risk-operation/enums/risk-filter-1-status.enum';
import { IsEnum, IsString } from 'class-validator';

export class UpdateRiskFilter1StatusDto {
  @IsEnum(RiskFilter1StatusEnum)
  status: RiskFilter1StatusEnum;

  @IsString()
  updatedBy: string;
}
