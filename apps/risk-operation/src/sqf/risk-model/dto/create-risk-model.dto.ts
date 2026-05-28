import { Transform } from 'class-transformer';
import { IsDefined, IsString } from 'class-validator';

export class CreateRiskModelDto {
  @IsDefined()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  riskModelName: string;

  @IsDefined()
  @IsString()
  description: string;
}
