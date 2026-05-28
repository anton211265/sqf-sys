import { UpdatableClientPersona } from '@app/common/apps/trade-directory/types/client-persona.type';
import { Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import { ClientPersona } from '../models';
import {
  ClientPersonaRepository,
  OrganizationRepository,
} from '../repositories';

type GetClientPersonasArgs = {
  organizationName?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class ClientPersonaService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly clientPersonaRepository: ClientPersonaRepository,
  ) {}

  getClientPersonas = async ({
    organizationName,
    pageSize = 50,
    pageNumber = 1,
  }: GetClientPersonasArgs) => {
    const [clientPersonas, totalCount] =
      await this.clientPersonaRepository.findAndCount({
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
      clientPersonas,
      pageNumber,
      pageSize,
      currentCount: Math.min(clientPersonas.length, pageSize),
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
  }): Promise<ClientPersona[]> => {
    return await this.clientPersonaRepository.find({
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
    },
  ): Promise<ClientPersona[]> => {
    return await this.clientPersonaRepository.find({
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

  createClientPersona = async (
    organizationId: number,
    args: UpdatableClientPersona,
  ): Promise<ClientPersona> => {
    const organization =
      await this.organizationRepository.findOneOrThrowException({
        where: {
          id: organizationId,
        },
      });

    const clientPersona = new ClientPersona({
      ...args,
      organization,
    });

    return await this.clientPersonaRepository.save(clientPersona);
  };

  updateClientPersona = async (
    id: number,
    args: UpdatableClientPersona,
  ): Promise<ClientPersona> => {
    return await this.clientPersonaRepository.findOneAndUpdate(
      { id: id },
      args,
    );
  };
}
