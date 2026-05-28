import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RiskFactorScoreMethodEnum } from '@app/common/apps/risk-operation/enums/risk-factor-score-method.enum';
import { CreateRiskEvaluationParameterDto } from '../../risk-evaluation-parameter/dto/create-risk-evaluation-parameter.dto';

class CountryListItemDto {
  @IsDefined()
  @IsString()
  countryName: string;

  @IsDefined()
  @IsNumber()
  score: number;
}

class RiskCountryCategoryDto {
  // Example of jsonb in countryList
  //   {
  //     "countryList": {
  //       "highRisk": [
  //         { "countryName": "Country A", "score": 85 },
  //         { "countryName": "Country B", "score": 90 }
  //       ],
  //       "mediumRisk": [
  //         { "countryName": "Country C", "score": 50 },
  //         { "countryName": "Country D", "score": 60 }
  //       ],
  //       "lowRisk": [
  //         { "countryName": "Country E", "score": 20 },
  //         { "countryName": "Country F", "score": 10 }
  //       ]
  //     }
  //   }
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryListItemDto)
  highRisk?: CountryListItemDto[] = [];

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryListItemDto)
  mediumRisk?: CountryListItemDto[] = []; // Default to empty array

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountryListItemDto)
  lowRisk?: CountryListItemDto[] = [];
}

export class CreateRiskFactorDto {
  @IsDefined()
  @IsOptional()
  @IsNumber()
  parentId?: number; // Optional parent ID (for sub-factors)

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  riskFactorName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDefined()
  @IsOptional()
  @IsNumber({ allowNaN: false }, { message: 'Weight must be a valid number' })
  @Min(1) // Minimum weight is 1%
  @Max(100) // Maximum weight is 100%
  weight: number | null;

  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  isSetAsCategory: boolean = false;

  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  hasSubFactor: boolean = false;

  @IsDefined()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.toUpperCase() : value))
  tabName: string;

  @IsEnum(RiskFactorScoreMethodEnum)
  @IsString()
  @IsOptional()
  scoreMethod: RiskFactorScoreMethodEnum;

  @IsOptional()
  @IsBoolean()
  isRequireEvaluationParameter: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  scoreRangeMin: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  scoreRangeMax: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RiskCountryCategoryDto)
  countryList?: RiskCountryCategoryDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRiskFactorDto)
  subFactors?: CreateRiskFactorDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRiskEvaluationParameterDto)
  evaluationParameters?: CreateRiskEvaluationParameterDto[];
}
