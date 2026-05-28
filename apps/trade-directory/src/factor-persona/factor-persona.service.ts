import { UpdatableFactorPersona } from '@app/common/apps/trade-directory/types/factor-persona.type';
import { Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import { FactorPersona } from '../models';
import {
  FactorPersonaRepository,
  OrganizationRepository,
} from '../repositories';

type GetFactorPersonasArgs = {
  organizationName?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class FactorPersonaService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly factorPersonaRepository: FactorPersonaRepository,
  ) {}

  getFactorPersonas = async ({
    organizationName,
    pageSize = 50,
    pageNumber = 1,
  }: GetFactorPersonasArgs) => {
    const [factorPersonas, totalCount] =
      await this.factorPersonaRepository.findAndCount({
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
      factorPersonas,
      pageNumber,
      pageSize,
      currentCount: Math.min(factorPersonas.length, pageSize),
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
  }): Promise<FactorPersona[]> => {
    return await this.factorPersonaRepository.find({
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
        includeContractAwarderPersona?: {
          value: boolean;
        };
        includeSupplierPersona?: {
          value: boolean;
        };
      };
    },
  ): Promise<FactorPersona[]> => {
    return await this.factorPersonaRepository.find({
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
              contractAwarderPersona:
                args.includeOrganization?.includeContractAwarderPersona?.value,
              supplierPersona:
                args.includeOrganization?.includeSupplierPersona?.value,
            }
          : undefined,
      },
    });
  };

  createFactorPersona = async (
    organizationId: number,
    args: UpdatableFactorPersona,
  ): Promise<FactorPersona> => {
    const organization =
      await this.organizationRepository.findOneOrThrowException({
        where: {
          id: organizationId,
        },
      });

    const factorPersona = new FactorPersona({
      ...args,
      organization,
    });

    return await this.factorPersonaRepository.save(factorPersona);
  };

  updateFactorPersona = async (
    id: number,
    args: UpdatableFactorPersona,
  ): Promise<FactorPersona> => {
    return await this.factorPersonaRepository.findOneAndUpdate(
      { id: id },
      args,
    );
  };
}
