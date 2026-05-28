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

class ClientSubmitApplicationEFormApplicationSupportingDocumentDto {
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
}

class ClientSubmitApplicationEFormClientBankAccountDto {
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

class ClientSubmitApplicationEFormClientPersonInChargeDto {
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

class ClientSubmitApplicationEFormClientAwarderContractVariationOrderDto {
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

class ClientSubmitApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto {
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

class ClientSubmitApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto {
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

class ClientSubmitApplicationEFormClientAwarderContractContractAwarderDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;

  @ApiProperty({
    type: [
      ClientSubmitApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () =>
      ClientSubmitApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto,
  )
  @IsArray()
  personInCharge: ClientSubmitApplicationEFormClientAwarderContractContractAwarderPersonInChargeDto[];

  @ApiProperty({
    type: [
      ClientSubmitApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () =>
      ClientSubmitApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto,
  )
  @IsArray()
  keyManagementPersonnel: ClientSubmitApplicationEFormClientAwarderContractContractAwarderKeyManagementPersonnelDto[];
}

class ClientSubmitApplicationEFormClientAwarderContractSupplierPersonInChargeDto {
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

class ClientSubmitApplicationEFormClientAwarderContractSupplierDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;

  @ApiProperty({
    type: [
      ClientSubmitApplicationEFormClientAwarderContractSupplierPersonInChargeDto,
    ],
  })
  @ValidateNested({ each: true })
  @Type(
    () =>
      ClientSubmitApplicationEFormClientAwarderContractSupplierPersonInChargeDto,
  )
  @IsArray()
  personInCharge: ClientSubmitApplicationEFormClientAwarderContractSupplierPersonInChargeDto[];
}

class ClientSubmitApplicationEFormClientAwarderContractDto {
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
    type: [ClientSubmitApplicationEFormClientAwarderContractVariationOrderDto],
  })
  @ValidateNested({ each: true })
  @Type(
    () => ClientSubmitApplicationEFormClientAwarderContractVariationOrderDto,
  )
  @IsArray()
  variationOrders: ClientSubmitApplicationEFormClientAwarderContractVariationOrderDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remark?: string;

  @ApiProperty({
    type: ClientSubmitApplicationEFormClientAwarderContractContractAwarderDto,
  })
  @ValidateNested({ each: true })
  @Type(
    () => ClientSubmitApplicationEFormClientAwarderContractContractAwarderDto,
  )
  contractAwarder: ClientSubmitApplicationEFormClientAwarderContractContractAwarderDto;

  @ApiProperty({
    type: [ClientSubmitApplicationEFormClientAwarderContractSupplierDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormClientAwarderContractSupplierDto)
  @IsArray()
  suppliers: ClientSubmitApplicationEFormClientAwarderContractSupplierDto[];
}

class ClientSubmitApplicationEFormDirectorDto {
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

class ClientSubmitApplicationEFormNextOfKinDto {
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

class ClientSubmitApplicationEFormCorporateGuarantorDto {
  @ApiProperty({
    type: UpdatableOrganization,
  })
  @ValidateNested({ each: true })
  @Type(() => UpdatableOrganization)
  organization: UpdatableOrganization;
}

export class ClientSubmitApplicationEFormBodyDto {
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
    type: [ClientSubmitApplicationEFormClientBankAccountDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormClientBankAccountDto)
  @IsArray()
  clientBankAccounts: ClientSubmitApplicationEFormClientBankAccountDto[];

  @ApiProperty({
    type: [ClientSubmitApplicationEFormClientPersonInChargeDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormClientPersonInChargeDto)
  @IsArray()
  clientPersonInCharge: ClientSubmitApplicationEFormClientPersonInChargeDto[];

  @ApiProperty({
    type: ClientSubmitApplicationEFormClientAwarderContractDto,
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormClientAwarderContractDto)
  clientAwarderContract: ClientSubmitApplicationEFormClientAwarderContractDto;

  @ApiProperty({
    type: [ClientSubmitApplicationEFormDirectorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormDirectorDto)
  @IsArray()
  directors: ClientSubmitApplicationEFormDirectorDto[];

  @ApiProperty({
    type: [ClientSubmitApplicationEFormNextOfKinDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormNextOfKinDto)
  @IsArray()
  nextOfKins: ClientSubmitApplicationEFormNextOfKinDto[];

  @ApiProperty({
    type: [ClientSubmitApplicationEFormCorporateGuarantorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormCorporateGuarantorDto)
  @IsArray()
  corporateGuarantors: ClientSubmitApplicationEFormCorporateGuarantorDto[];

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
    type: [ClientSubmitApplicationEFormApplicationSupportingDocumentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ClientSubmitApplicationEFormApplicationSupportingDocumentDto)
  @IsArray()
  applicationSupportingDocuments: ClientSubmitApplicationEFormApplicationSupportingDocumentDto[];
}
