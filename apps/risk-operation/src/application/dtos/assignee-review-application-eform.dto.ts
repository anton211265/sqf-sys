import { ApplicationSupportingDocumentTypeEnum } from '@app/common/apps/risk-operation/enums/application-supporting-document-type.enum';
import { ClientAwarderContractAssignmentMethodEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-assignment-method.enum';
import { ClientAwarderContractCollectionMethodEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-collection-method.enum';
import { ClientAwarderContractFundingChannelEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-funding-channel.enum';
import { ClientAwarderContractNatureEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-nature.enum';
import { ClientAwarderContractTypeEnum } from '@app/common/apps/risk-operation/enums/client-awarder-contract-type.enum';
import { LeadSourceEnum } from '@app/common/apps/risk-operation/enums/lead-source.enum';
import { UpdatableBankAccount } from '@app/common/apps/trade-directory/types/bank-account.type';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import { UpdatableOrganization } from '@app/common/apps/trade-directory/types/organization.type';
import { UpdatablePerson } from '@app/common/apps/trade-directory/types/person.type';
import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AssigneeReviewApplicationEFormApplicationSupportingDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bucketKey: string;

  @ApiProperty({
    enum: ApplicationSupportingDocumentTypeEnum,
  })
  @IsEnum(ApplicationSupportingDocumentTypeEnum)
  supportingDocumentType: ApplicationSupportingDocumentTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileExtension: string;

  @ApiProperty()
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  isVerified?: boolean;
}

class AssigneeReviewApplicationEFormClientBankAccountDto {
  @ApiProperty({
    type: UpdatableBankAccount,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableBankAccount)
  bankAccount: UpdatableBankAccount;

  @ApiProperty()
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  preferred?: boolean;

  @ApiProperty()
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  escrow?: boolean;
}

class AssigneeReviewApplicationEFormClientPersonInChargeDto {
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

class AssigneeReviewApplicationEFormClientAwarderContractVariationOrderDto {
  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  variationOrderStartDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  variationOrderEndDate: Date;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  variationOrderValue: number;

  @ApiProperty({
    enum: CurrencyCodeEnum,
  })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  variationOrderCurrency?: CurrencyCodeEnum;
}

class AssigneeReviewApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto {
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

class AssigneeReviewApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto {
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

class AssigneeReviewApplicationEFormClientAwarderContractContractAwarderDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;

  @ApiProperty({
    type: [
      AssigneeReviewApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () =>
      AssigneeReviewApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto,
  )
  @IsArray()
  personInCharge: AssigneeReviewApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto[];

  @ApiProperty({
    type: [
      AssigneeReviewApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () =>
      AssigneeReviewApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto,
  )
  @IsArray()
  keyManagementPersonnel: AssigneeReviewApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto[];
}

class AssigneeReviewApplicationEFormClientAwarderContractSupplierPersonInChargeDto {
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

class AssigneeReviewApplicationEFormClientAwarderContractSupplierDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;

  @ApiProperty({
    type: [
      AssigneeReviewApplicationEFormClientAwarderContractSupplierPersonInChargeDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () =>
      AssigneeReviewApplicationEFormClientAwarderContractSupplierPersonInChargeDto,
  )
  @IsArray()
  personInCharge: AssigneeReviewApplicationEFormClientAwarderContractSupplierPersonInChargeDto[];
}

class AssigneeReviewApplicationEFormClientAwarderContractDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractTitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @ApiProperty({
    enum: ClientAwarderContractTypeEnum,
  })
  @IsEnum(ClientAwarderContractTypeEnum)
  contractType: ClientAwarderContractTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  contractTypeOther?: string;

  @ApiProperty({
    enum: ClientAwarderContractNatureEnum,
  })
  @IsEnum(ClientAwarderContractNatureEnum)
  contractNature: ClientAwarderContractNatureEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  contractStatus?: string;

  @ApiProperty({
    enum: ClientAwarderContractAssignmentMethodEnum,
  })
  @IsEnum(ClientAwarderContractAssignmentMethodEnum)
  assignmentMethod: ClientAwarderContractAssignmentMethodEnum;

  @ApiProperty({
    enum: ClientAwarderContractFundingChannelEnum,
  })
  @IsEnum(ClientAwarderContractFundingChannelEnum)
  fundingChannel: ClientAwarderContractFundingChannelEnum;

  @ApiProperty({
    enum: ClientAwarderContractCollectionMethodEnum,
  })
  @IsEnum(ClientAwarderContractCollectionMethodEnum)
  collectionMethod: ClientAwarderContractCollectionMethodEnum;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  contractStartDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  contractEndDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  extensionOfTenure?: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  contractSigningDate: Date;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  totalContractValue: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  totalContractValueClaimed: number;

  @ApiProperty({
    enum: CurrencyCodeEnum,
  })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  totalContractValueCurrency?: CurrencyCodeEnum;

  @ApiProperty({
    type: [
      AssigneeReviewApplicationEFormClientAwarderContractVariationOrderDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () => AssigneeReviewApplicationEFormClientAwarderContractVariationOrderDto,
  )
  @IsArray()
  variationOrders: AssigneeReviewApplicationEFormClientAwarderContractVariationOrderDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remark?: string;

  @ApiProperty({
    type: AssigneeReviewApplicationEFormClientAwarderContractContractAwarderDto,
  })
  @ValidateNested({ each: true })
  @Type(
    () => AssigneeReviewApplicationEFormClientAwarderContractContractAwarderDto,
  )
  contractAwarder: AssigneeReviewApplicationEFormClientAwarderContractContractAwarderDto;

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormClientAwarderContractSupplierDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormClientAwarderContractSupplierDto)
  @IsArray()
  suppliers: AssigneeReviewApplicationEFormClientAwarderContractSupplierDto[];
}

class AssigneeReviewApplicationEFormDirectorDto {
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

class AssigneeReviewApplicationEFormNextOfKinDto {
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

class AssigneeReviewApplicationEFormCorporateGuarantorDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;
}

export class AssigneeReviewApplicationEFormBodyDto {
  @ApiProperty({
    enum: LeadSourceEnum,
  })
  @IsEnum(LeadSourceEnum)
  @IsOptional()
  leadSource?: LeadSourceEnum;

  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  clientOrganization?: UpdatableOrganization;

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormClientBankAccountDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormClientBankAccountDto)
  @IsArray()
  clientBankAccounts: AssigneeReviewApplicationEFormClientBankAccountDto[];

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormClientPersonInChargeDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormClientPersonInChargeDto)
  @IsArray()
  clientPersonInCharge: AssigneeReviewApplicationEFormClientPersonInChargeDto[];

  @ApiProperty({
    type: AssigneeReviewApplicationEFormClientAwarderContractDto,
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormClientAwarderContractDto)
  clientAwarderContract: AssigneeReviewApplicationEFormClientAwarderContractDto;

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormDirectorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormDirectorDto)
  @IsArray()
  directors: AssigneeReviewApplicationEFormDirectorDto[];

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormNextOfKinDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormNextOfKinDto)
  @IsArray()
  nextOfKins: AssigneeReviewApplicationEFormNextOfKinDto[];

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormCorporateGuarantorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormCorporateGuarantorDto)
  @IsArray()
  corporateGuarantors: AssigneeReviewApplicationEFormCorporateGuarantorDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remark?: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  numberOfContractSecured?: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  valueOfContractSecured?: number;

  @ApiProperty({
    enum: CurrencyCodeEnum,
  })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  valueOfContractSecuredCurrency?: CurrencyCodeEnum;

  @ApiProperty({
    type: [AssigneeReviewApplicationEFormApplicationSupportingDocumentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AssigneeReviewApplicationEFormApplicationSupportingDocumentDto)
  @IsArray()
  applicationSupportingDocuments: AssigneeReviewApplicationEFormApplicationSupportingDocumentDto[];
}

export class AssigneeReviewApplicationEFormParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}
