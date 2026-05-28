import { RiskApplicationAuditActionEnum } from '@app/common/apps/risk-operation/enums/risk-application-audit-action.enum';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRiskApplicationAuditLogDto {
  @IsString()
  applicationNumber: string;

  @IsString()
  performedBy: string;

  @IsEnum(RiskApplicationAuditActionEnum)
  actionType: RiskApplicationAuditActionEnum;
}
