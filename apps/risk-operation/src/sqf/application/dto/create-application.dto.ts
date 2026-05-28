import {
  ValidateNested,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsDefined,
  IsString,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatablePerson } from '@app/common/apps/trade-directory/types/person.type';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import { CreateOrganizationDto } from 'apps/trade-directory/src/sqf/organization/dto/create-organization-dto';
import { ApplicationPersonaEnum } from '@app/common/apps/risk-operation/enums/application-persona.enum';

// Example of input in /risk-operation/api/applications
// {
//   "organization": {
//       "organizationName": "nurun sdn bhd",
//       "businessRegistrationNumber": "123456789",
//       "organizationType": "PRIVATE_LIMITED",
//       "country": "MY"
//   },
//   "applicationPersona": "BORROWER",
//   "personInCharge": [
//       {
//           "person": {
//               "name": "nuwun testing5",
//               "mobileNumber": "+1234567890",
//               "email": "nurun@synlian.net",
//               "residentialAddress": "johor",
//               "identificationNumber": "999-88-66"
//           },
//           "organizationPerson": {
//               "designation": "kerani5"
//           }
//       }
//   ]
// }

// Main DTO for creating an application

export class PersonInChargeDto {
  @ValidateNested()
  @Type(() => UpdatablePerson)
  @IsNotEmpty()
  person: UpdatablePerson;

  @ValidateNested()
  @Type(() => UpdatableOrganizationPerson)
  @IsNotEmpty()
  organizationPerson: UpdatableOrganizationPerson;
}

export class CreateApplicationDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateOrganizationDto)
  organization: CreateOrganizationDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PersonInChargeDto)
  personInCharge: PersonInChargeDto[];

  @IsEnum(ApplicationPersonaEnum) // This ensures the value is one of the enum values
  @IsString()
  @IsNotEmpty()
  applicationPersona: ApplicationPersonaEnum;
}
