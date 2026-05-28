import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';
import { IsDefined, IsString } from 'class-validator';

export class UpdateRiskModelStatusDto {
  @IsDefined()
  @IsString()
  status: RiskModelStatusEnum;
}
