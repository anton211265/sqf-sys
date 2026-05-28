import { Type } from 'class-transformer';
import { IsDefined, IsNumber } from 'class-validator';

export class RequestClientConsentParamDto {
  @IsNumber()
  @Type(() => Number)
  @IsDefined()
  applicationId: number;
}
