import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class AssignRiskModelToApplicationScoringDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  riskModelNumber: string;
}
