import { ApiProperty } from '@nestjs/swagger';
import { OrganizationPerson as TradeDirectoryOrganizationPerson } from 'apps/trade-directory/src/models';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatableOrganizationPerson {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  designation?: string;

  // @ApiProperty()
  // @IsString()
  // @IsNotEmpty()
  // @IsOptional()
  sub?: string;
}

export type OrganizationPerson = TradeDirectoryOrganizationPerson;
