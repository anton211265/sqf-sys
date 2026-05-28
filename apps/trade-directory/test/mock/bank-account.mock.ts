import { BankAccountTypeEnum } from '@app/common/apps/trade-directory/enums/bank-account-type.enum';
import { BankProviderEnum } from '@app/common/apps/trade-directory/enums/bank-provider.enum';
import { faker } from '@faker-js/faker';
import { BankAccount } from 'apps/trade-directory/src/models';

const mockBankAccount = (): BankAccount => {
  const bankAccount = new BankAccount({
    bankProvider: faker.helpers.enumValue(BankProviderEnum),
    accountHolderName: faker.company.name(),
    branchName: faker.company.name(),
    bankAddress: faker.location.streetAddress(),
    bankAccountNumber: faker.finance.accountNumber(),
    swiftCode: faker.string.uuid(),
    branchCode: faker.finance.bic(),
    bankAccountType: faker.helpers.enumValue(BankAccountTypeEnum),
    onlineBankAvailable: faker.datatype.boolean(),
  });

  return bankAccount;
};

export { mockBankAccount };
