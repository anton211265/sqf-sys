import { Type } from 'class-transformer';
import { IsDefined, IsNumber } from 'class-validator';

export class CreateApplicationPublicParamDto {
  @IsNumber()
  @Type(() => Number)
  @IsDefined()
  applicationId: number;
}
