import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OrganizationsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;
}
