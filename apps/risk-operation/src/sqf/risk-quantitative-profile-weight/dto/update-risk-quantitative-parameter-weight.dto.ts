// dto/update-quantitative-parameter-weight.dto.ts
import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class UpdateRiskQuantitativeParameterWeightDto {
  @IsString()
  @IsNotEmpty()
  quantitativeParameterName: string;

  @IsNumber()
  @IsNotEmpty()
  weight: number;
}
