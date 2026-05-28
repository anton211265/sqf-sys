// dto/update-quantitative-parameter-weight.dto.ts
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class UpdateRiskQuantitativeSubParameterWeightDto {
  @IsString()
  @IsNotEmpty()
  quantitativeParameterName: string;

  @IsString()
  @IsNotEmpty()
  quantitativeSubParameterName: string;

  @IsNumber()
  @IsNotEmpty()
  weight: number;
}
