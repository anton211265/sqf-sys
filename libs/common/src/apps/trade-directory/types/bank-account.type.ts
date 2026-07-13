import { CurrencyCodeEnum } from '@app/common/constants/currencies';
import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BankAccountTypeEnum } from '../enums/bank-account-type.enum';
import { Organization } from './organization.type';
import { Person } from './person.type';
import { BankProviderEnum } from '../enums/bank-provider.enum';

export class UpdatableBankAccount {
  @ApiProperty({
    enum: BankProviderEnum,
  })
  @IsEnum(BankProviderEnum)
  @IsOptional()
  bankProvider?: BankProviderEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  accountHolderName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  branchName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  bankAddress?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  swiftCode?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  branchCode?: string;

  @ApiProperty({
    enum: BankAccountTypeEnum,
  })
  @IsEnum(BankAccountTypeEnum)
  @IsOptional()
  bankAccountType?: BankAccountTypeEnum;

  @ApiProperty({
    enum: CurrencyCodeEnum,
  })
  @IsEnum(CurrencyCodeEnum)
  @IsOptional()
  currency?: CurrencyCodeEnum;

  @ApiProperty()
  @IsBoolean()
  @BooleanTransformer()
  @IsOptional()
  onlineBankAvailable?: boolean;
}

// Standalone shape (the bank_account entity was removed with the LCM cleanup);
// kept because the proto layer still exchanges bank-account payloads.
export type BankAccount = Required<UpdatableBankAccount> & {
  id: number;
  organizationId: number;
  organization?: Organization;
  personId: number;
  person?: Person;
  createdAt: Date;
  updatedAt: Date;
};
