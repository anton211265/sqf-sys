import { GuarantorRelationshipToApplicantEnum } from '@app/common/apps/trade-directory/enums/guarantor-relationship-to-applicant.enum';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import { UpdatablePerson } from '@app/common/apps/trade-directory/types/person.type';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// Shareholders DTO
export class ShareholderDto {
  @ApiProperty({ type: () => UpdatablePerson })
  @ValidateNested()
  @Type(() => UpdatablePerson)
  @IsNotEmpty()
  person: UpdatablePerson;

  @ApiProperty({ type: () => UpdatableOrganizationPerson })
  @ValidateNested()
  @Type(() => UpdatableOrganizationPerson)
  @IsNotEmpty()
  organizationPerson: UpdatableOrganizationPerson;

  @ApiProperty({
    example: 25,
    description: 'Percentage of shares held by the shareholder',
  })
  @IsNumber()
  @IsNotEmpty()
  shareholdingPercentage: number;
}

// Directors DTO
export class DirectorDto {
  @ApiProperty({ type: () => UpdatablePerson })
  @ValidateNested()
  @Type(() => UpdatablePerson)
  @IsNotEmpty()
  person: UpdatablePerson;

  @ApiProperty({ type: () => UpdatableOrganizationPerson })
  @ValidateNested()
  @Type(() => UpdatableOrganizationPerson)
  @IsNotEmpty()
  organizationPerson: UpdatableOrganizationPerson;

  @ApiProperty({
    example: true,
    description: 'Whether the director is an authorised signatory',
  })
  @IsBoolean()
  @IsNotEmpty()
  authoriseSignatory?: boolean;
}

// Guarantors DTO
export class GuarantorDto {
  @ApiProperty({ type: () => UpdatablePerson })
  @ValidateNested()
  @Type(() => UpdatablePerson)
  @IsNotEmpty()
  person: UpdatablePerson;

  @ApiProperty({ type: () => UpdatableOrganizationPerson })
  @ValidateNested()
  @Type(() => UpdatableOrganizationPerson)
  @IsNotEmpty()
  organizationPerson: UpdatableOrganizationPerson;

  @ApiProperty({
    example: 'CFO',
    description: 'Relationship between the guarantor and the applicant',
  })
  @IsEnum(GuarantorRelationshipToApplicantEnum) // This ensures the value is one of the enum values
  @IsString()
  @IsNotEmpty()
  relationshipToApplicant: GuarantorRelationshipToApplicantEnum;

  @IsOptional()
  @IsString()
  relationshipToApplicantOther?: string;
}

// Main DTO for updating rep details (shareholders, directors, guarantors)
export class UpdateRepresentativeDetailsDto {
  @ApiProperty({ type: [ShareholderDto], description: 'List of shareholders' })
  @IsArray() // Ensures it is treated as an array
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ShareholderDto)
  shareholders: ShareholderDto[];

  @ApiProperty({ type: [DirectorDto], description: 'List of directors' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DirectorDto)
  directors: DirectorDto[];

  @ApiProperty({ type: [GuarantorDto], description: 'List of guarantors' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuarantorDto)
  @IsOptional()
  guarantors?: GuarantorDto[];
}
