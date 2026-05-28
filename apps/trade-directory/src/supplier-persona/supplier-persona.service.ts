import { UpdatableSupplierPersona } from '@app/common/apps/trade-directory/types/supplier-persona.type';
import { Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import { SupplierPersona } from '../models';
import {
  OrganizationRepository,
  SupplierPersonaRepository,
} from '../repositories';

type GetSupplierPersonasArgs = {
  organizationName?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class SupplierPersonaService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly supplierPersonaRepository: SupplierPersonaRepository,
  ) {}

  getSupplierPersonas = async ({
    organizationName,
    pageSize = 50,
    pageNumber = 1,
  }: GetSupplierPersonasArgs) => {
    const [supplierPersonas, totalCount] =
      await this.supplierPersonaRepository.findAndCount({
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
      supplierPersonas,
      pageNumber,
      pageSize,
      currentCount: Math.min(supplierPersonas.length, pageSize),
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
  }): Promise<SupplierPersona[]> => {
    return await this.supplierPersonaRepository.find({
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
        includeFactorPersona?: {
          value: boolean;
        };
      };
    },
  ): Promise<SupplierPersona[]> => {
    return await this.supplierPersonaRepository.find({
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
              factorPersona:
                args.includeOrganization?.includeFactorPersona?.value,
            }
          : undefined,
      },
    });
  };

  createSupplierPersona = async (
    organizationId: number,
    args: UpdatableSupplierPersona,
  ): Promise<SupplierPersona> => {
    const organization =
      await this.organizationRepository.findOneOrThrowException({
        where: {
          id: organizationId,
        },
      });

    const supplierPersona = new SupplierPersona({
      ...args,
      organization,
    });

    return await this.supplierPersonaRepository.save(supplierPersona);
  };

  updateSupplierPersona = async (
    id: number,
    args: UpdatableSupplierPersona,
  ): Promise<SupplierPersona> => {
    return await this.supplierPersonaRepository.findOneAndUpdate(
      { id: id },
      args,
    );
  };
}
