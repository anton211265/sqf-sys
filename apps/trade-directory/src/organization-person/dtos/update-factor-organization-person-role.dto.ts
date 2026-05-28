import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber } from 'class-validator';

export class UpdateFactorOrganizationPersonRoleBodyDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  organizationPersonId: number;

  @ApiProperty({ enum: OrganizationPersonRoleEnum, isArray: true })
  @IsEnum(OrganizationPersonRoleEnum, {
    each: true,
  })
  @IsArray()
  roles: OrganizationPersonRoleEnum[];
}
