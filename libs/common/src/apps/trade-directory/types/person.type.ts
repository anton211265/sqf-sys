import { ApiProperty } from '@nestjs/swagger';
import { Person as TradeDirectoryPerson } from 'apps/trade-directory/src/models';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatablePerson {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  // @ApiProperty()
  // @IsString()
  // @IsNotEmpty()
  // @IsOptional()
  preferredUsername?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  residentialAddress?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  identificationNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  email?: string;
}

export type Person = TradeDirectoryPerson;
