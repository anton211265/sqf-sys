import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

class AuthOrganizationPersonRoleResponseDto {
  @ApiProperty({
    enum: OrganizationPersonRoleEnum,
  })
  @IsEnum(OrganizationPersonRoleEnum)
  role: OrganizationPersonRoleEnum;
}

export class AuthResponseDto {
  @ApiProperty()
  @IsInt()
  personId: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  preferredUsername: string;

  @ApiProperty()
  @IsString()
  identificationNumber: string;

  @ApiProperty()
  @IsString()
  mobileNumber: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  sub: string;

  @ApiProperty()
  @IsInt()
  organizationPersonId: number;

  @ApiProperty({ type: [AuthOrganizationPersonRoleResponseDto] })
  organizationPersonRoles: AuthOrganizationPersonRoleResponseDto[];

  @ApiProperty()
  @IsInt()
  organizationId: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  clientPersonaId?: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  buyerPersonaId?: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  supplierPersonaId?: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  funderPersonaId?: number;
}
