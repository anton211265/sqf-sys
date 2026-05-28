import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetRiskFactorScoresDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') // Transform query string to boolean
  includeRiskParameterGrading?: boolean;
}
