import { UpdatableBankAccount } from '@app/common/apps/trade-directory/types/bank-account.type';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import { BankAccount, Organization, Person } from '../models';
import {
  BankAccountRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';

type GetBankAccountsArgs = {
  accountHolderName?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class BankAccountService {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly personRepository: PersonRepository,
  ) {}

  getBankAccounts = async (
    filter: { organizationId?: number; clientPersonaId?: number },
    { accountHolderName, pageSize = 50, pageNumber = 1 }: GetBankAccountsArgs,
  ) => {
    const [bankAccounts, totalCount] =
      await this.bankAccountRepository.findAndCount({
        where: {
          organization: {
            id: filter.organizationId,
            clientPersonaId: filter.clientPersonaId,
          },
          accountHolderName: accountHolderName
            ? ILike(`%${accountHolderName}%`)
            : undefined,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      bankAccounts,
      pageNumber,
      pageSize,
      currentCount: Math.min(bankAccounts.length, pageSize),
      totalCount,
    };
  };

  getAll = async (args: {
    includeOrganization?: {
      value: boolean;
    };
    includePerson?: {
      value: boolean;
    };
  }): Promise<BankAccount[]> => {
    return await this.bankAccountRepository.find({
      relations: {
        organization: args.includeOrganization?.value,
        person: args.includePerson?.value,
      },
    });
  };

  findById = async (
    id: number[],
    args: {
      includeOrganization?: {
        value: boolean;
      };
      includePerson?: {
        value: boolean;
      };
    },
  ): Promise<BankAccount[]> => {
    return await this.bankAccountRepository.find({
      where: {
        id: In(id),
      },
      relations: {
        organization: args.includeOrganization?.value,
        person: args.includePerson?.value,
      },
    });
  };

  findByOrganizationId = async (
    organizationId: number,
  ): Promise<BankAccount[]> => {
    return await this.bankAccountRepository.find({
      where: {
        organization: {
          id: organizationId,
        },
      },
    });
  };

  createBankAccount = async (
    owner: { organizationId?: number; personId?: number },
    args: UpdatableBankAccount,
  ): Promise<BankAccount> => {
    if (!owner.organizationId && !owner.personId) {
      throw new BadRequestException(
        'Bank account owner must be either an organization or a person.',
      );
    }

    let organization: Organization;
    if (owner.organizationId) {
      organization = await this.organizationRepository.findOneOrThrowException({
        where: { id: owner.organizationId },
      });
    }

    let person: Person;
    if (owner.personId) {
      person = await this.personRepository.findOneOrThrowException({
        where: { id: owner.personId },
      });
    }

    const bankAccount = new BankAccount({
      ...args,
      organization,
      person,
    });

    return await this.bankAccountRepository.save(bankAccount);
  };

  updateBankAccount = async (
    id: number,
    args: UpdatableBankAccount,
  ): Promise<BankAccount> => {
    return await this.bankAccountRepository.findOneAndUpdate({ id: id }, args);
  };
}
