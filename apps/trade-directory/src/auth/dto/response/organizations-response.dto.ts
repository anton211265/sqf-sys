import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

class OrganizationData {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class OrganizationsResponseDto {
  @ApiProperty({ type: [OrganizationData] })
  @IsNotEmpty()
  @IsArray()
  @Type(() => OrganizationData)
  organizations: OrganizationData[];
}
