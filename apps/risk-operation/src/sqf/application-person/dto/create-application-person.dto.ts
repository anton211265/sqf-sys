import { IsInt, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationPersonTypeEnum } from '@app/common/apps/risk-operation/enums/application-person-type.enum';
import { OrganizationPerson } from 'apps/trade-directory/src/models';
import { Application } from 'apps/risk-operation/src/models';

export class CreateApplicationPersonDto {
  @IsInt()
  organizationId: number;

  @IsInt()
  applicationId: number;

  @IsEnum(ApplicationPersonTypeEnum)
  applicationPersonType: ApplicationPersonTypeEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizationPerson)
  organizationPersons: OrganizationPerson[];
}
