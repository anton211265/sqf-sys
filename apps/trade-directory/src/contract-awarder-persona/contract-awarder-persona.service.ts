import { UpdatableContractAwarderPersona } from '@app/common/apps/trade-directory/types/contract-awarder-persona.type';
import { Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import { ContractAwarderPersona } from '../models';
import {
  ContractAwarderPersonaRepository,
  OrganizationRepository,
} from '../repositories';

type GetContractAwarderPersonasArgs = {
  organizationName?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class ContractAwarderPersonaService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly contractAwarderPersonaRepository: ContractAwarderPersonaRepository,
  ) {}

  getContractAwarderPersonas = async ({
    organizationName,
    pageSize = 50,
    pageNumber = 1,
  }: GetContractAwarderPersonasArgs) => {
    const [contractAwarderPersonas, totalCount] =
      await this.contractAwarderPersonaRepository.findAndCount({
        where: {
          organization: {
            organizationName: organizationName
              ? ILike(`%${organizationName}%`)
              : undefined,
          },
        },
        relations: {
          organization: true,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      contractAwarderPersonas,
      pageNumber,
      pageSize,
      currentCount: Math.min(contractAwarderPersonas.length, pageSize),
      totalCount,
    };
  };

  getAll = async (args: {
    includeOrganization?: {
      value: boolean;
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
      };
      includeBankAccount?: {
        value: boolean;
      };
      includeContractAwarderPersona?: {
        value: boolean;
      };
      includeSupplierPersona?: {
        value: boolean;
      };
      includeFactorPersona?: {
        value: boolean;
      };
    };
  }): Promise<ContractAwarderPersona[]> => {
    return await this.contractAwarderPersonaRepository.find({
      relations: {
        organization: args.includeOrganization?.value
          ? {
              organizationPersons: args.includeOrganization
                ?.includeOrganizationPerson?.value
                ? {
                    person:
                      args.includeOrganization?.includeOrganizationPerson
                        ?.includePerson?.value,
                  }
                : undefined,
              bankAccounts: args.includeOrganization?.includeBankAccount?.value,
              contractAwarderPersona:
                args.includeOrganization?.includeContractAwarderPersona?.value,
              supplierPersona:
                args.includeOrganization?.includeSupplierPersona?.value,
              factorPersona:
                args.includeOrganization?.includeFactorPersona?.value,
            }
          : undefined,
      },
    });
  };

  findById = async (
    id: number[],
    args: {
      includeOrganization?: {
        value: boolean;
        includeOrganizationPerson?: {
          value: boolean;
          includePerson?: {
            value: boolean;
          };
        };
        includeBankAccount?: {
          value: boolean;
        };
        includeClientPersona?: {
          value: boolean;
        };
        includeSupplierPersona?: {
          value: boolean;
        };
        includeFactorPersona?: {
          value: boolean;
        };
      };
    },
  ): Promise<ContractAwarderPersona[]> => {
    return await this.contractAwarderPersonaRepository.find({
      where: {
        id: In(id),
      },
      relations: {
        organization: args.includeOrganization?.value
          ? {
              organizationPersons: args.includeOrganization
                ?.includeOrganizationPerson?.value
                ? {
                    person:
                      args.includeOrganization?.includeOrganizationPerson
                        ?.includePerson?.value,
                  }
                : undefined,
              bankAccounts: args.includeOrganization?.includeBankAccount?.value,
              clientPersona:
                args.includeOrganization?.includeClientPersona?.value,
              supplierPersona:
                args.includeOrganization?.includeSupplierPersona?.value,
              factorPersona:
                args.includeOrganization?.includeFactorPersona?.value,
            }
          : undefined,
      },
    });
  };

  createContractAwarderPersona = async (
    organizationId: number,
    args: UpdatableContractAwarderPersona,
  ): Promise<ContractAwarderPersona> => {
    const organization =
      await this.organizationRepository.findOneOrThrowException({
        where: {
          id: organizationId,
        },
      });

    const contractAwarderPersona = new ContractAwarderPersona({
      ...args,
      organization,
    });

    return await this.contractAwarderPersonaRepository.save(
      contractAwarderPersona,
    );
  };

  updateContractAwarderPersona = async (
    id: number,
    args: UpdatableContractAwarderPersona,
  ): Promise<ContractAwarderPersona> => {
    return await this.contractAwarderPersonaRepository.findOneAndUpdate(
      { id: id },
      args,
    );
  };
}
