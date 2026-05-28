import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import { UpdatableOrganization } from '@app/common/apps/trade-directory/types/organization.type';
import { UpdatablePerson } from '@app/common/apps/trade-directory/types/person.type';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

class CreateApplicationClientContactPersonDto {
  @ApiProperty({
    type: UpdatablePerson,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatablePerson)
  person: UpdatablePerson;

  @ApiProperty({
    type: UpdatableOrganizationPerson,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganizationPerson)
  organizationPerson: UpdatableOrganizationPerson;
}

class CreateApplicationClientAwarderContractContractAwarderDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;
}

class CreateApplicationClientAwarderContractDto {
  @ApiProperty({
    type: CreateApplicationClientAwarderContractContractAwarderDto,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateApplicationClientAwarderContractContractAwarderDto)
  contractAwarder: CreateApplicationClientAwarderContractContractAwarderDto;
}

export class CreateApplicationBodyDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  clientOrganization?: UpdatableOrganization;

  @ApiProperty({
    type: [CreateApplicationClientContactPersonDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateApplicationClientContactPersonDto)
  @IsArray()
  clientContactPersons: CreateApplicationClientContactPersonDto[];

  @ApiProperty({
    type: CreateApplicationClientAwarderContractDto,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateApplicationClientAwarderContractDto)
  clientAwarderContract: CreateApplicationClientAwarderContractDto;
}
