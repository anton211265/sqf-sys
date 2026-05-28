import { IsDefined, IsNumber, Max, Min } from 'class-validator';

export class UpdateRiskThresholdDto {
  @IsDefined()
  @IsNumber()
  @Min(0)
  @Max(100)
  minLow: number;

  @IsDefined()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxLow: number;

  @IsDefined()
  @IsNumber()
  @Min(0)
  @Max(100)
  minMedium: number;

  @IsDefined()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxMedium: number;

  @IsDefined()
  @IsNumber()
  @Min(0)
  @Max(100)
  minHigh: number;

  @IsDefined()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxHigh: number;
}
