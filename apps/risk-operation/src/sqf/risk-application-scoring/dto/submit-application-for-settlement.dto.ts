import { IsBoolean, IsDefined } from 'class-validator';

export class SubmitApplicationForSettlementDto {
  @IsBoolean()
  @IsDefined()
  isAuthorizationRequired: boolean;
}
