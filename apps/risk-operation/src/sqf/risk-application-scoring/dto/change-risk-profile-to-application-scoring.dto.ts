import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class changeRiskProfileToApplicationScoringDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  riskProfileCode: string;
}
