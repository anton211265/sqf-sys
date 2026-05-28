import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDefined,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreatePersonDto {
  @IsDefined()
  @IsString()
  @Transform(({ value }) => value.toUpperCase()) // Transformed by using plainToInstance in Kafka consumer
  name: string;

  @IsOptional()
  @IsString()
  preferredUsername: string | null;

  @IsDefined()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  residentialAddress: string;

  @IsDefined()
  @IsString()
  identificationNumber: string;

  @IsDefined()
  @IsString()
  mobileNumber: string;

  @IsDefined()
  @IsString()
  email: string;

  @IsDefined()
  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  designation: string;
}
