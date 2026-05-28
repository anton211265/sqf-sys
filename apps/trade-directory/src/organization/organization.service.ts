import {
  CreateOrganizationMessage,
  CreateOrganizationMessageReply,
  UpdateOrganizationByClientPersonaIdMessage,
  UpdateOrganizationByContractAwarderPersonaIdMessage,
  UpdateOrganizationByFactorPersonaIdMessage,
  UpdateOrganizationBySupplierPersonaIdMessage,
  UpdateOrganizationMessage,
  UpdateOrganizationMessageReply,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { UpdatableOrganization } from '@app/common/apps/trade-directory/types/organization.type';
import { Injectable } from '@nestjs/common';
import { ILike, In } from 'typeorm';
import {
  ClientPersona,
  ContractAwarderPersona,
  FactorPersona,
  Organization,
  SupplierPersona,
} from '../models';
import { OrganizationRepository } from '../repositories';

type GetOrganizationArgs = {
  includeOrganizationPerson?: {
    value: boolean;
    includePerson?: {
      value: boolean;
    };
    includeOrganizationPersonRole?: {
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
  includeFactorPersona?: {
    value: boolean;
  };
};

type GetOrganizationsArgs = {
  organizationName?: string;
  pageSize?: number;
  pageNumber?: number;
} & GetOrganizationArgs;

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  getOrganization = async (
    id: number,
    {
      includeOrganizationPerson,
      includeBankAccount,
      includeClientPersona,
      includeContractAwarderPersona,
      includeSupplierPersona,
      includeFactorPersona,
    }: GetOrganizationArgs,
  ) => {
    const organization = await this.organizationRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        organizationPersons: includeOrganizationPerson?.value
          ? {
              person: includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                includeOrganizationPerson?.includeOrganizationPersonRole?.value,
            }
          : undefined,
        bankAccounts: includeBankAccount?.value,
        clientPersona: includeClientPersona?.value,
        contractAwarderPersona: includeContractAwarderPersona?.value,
        supplierPersona: includeSupplierPersona?.value,
        factorPersona: includeFactorPersona?.value,
      },
    });

    return organization;
  };

  getOrganizations = async ({
    organizationName,
    pageSize = 50,
    pageNumber = 1,
    includeOrganizationPerson,
    includeBankAccount,
    includeClientPersona,
    includeContractAwarderPersona,
    includeSupplierPersona,
    includeFactorPersona,
  }: GetOrganizationsArgs) => {
    const [organizations, totalCount] =
      await this.organizationRepository.findAndCountExcludeFactorPersona({
        where: {
          organizationName: organizationName
            ? ILike(`%${organizationName}%`)
            : undefined,
        },
        relations: {
          organizationPersons: includeOrganizationPerson?.value
            ? {
                person: includeOrganizationPerson?.includePerson?.value,
                organizationPersonRoles:
                  includeOrganizationPerson?.includeOrganizationPersonRole
                    ?.value,
              }
            : undefined,
          bankAccounts: includeBankAccount?.value,
          clientPersona: includeClientPersona?.value,
          contractAwarderPersona: includeContractAwarderPersona?.value,
          supplierPersona: includeSupplierPersona?.value,
          factorPersona: includeFactorPersona?.value,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      organizations,
      pageNumber,
      pageSize,
      currentCount: Math.min(organizations.length, pageSize),
      totalCount,
    };
  };

  getAll = async (args: {
    includeOrganizationPerson?: {
      value: boolean;
      includePerson?: {
        value: boolean;
      };
      includeOrganizationPersonRole?: {
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
    includeFactorPersona?: {
      value: boolean;
    };
  }): Promise<Organization[]> => {
    return await this.organizationRepository.findExcludeFactorPersona({
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: args.includeClientPersona?.value,
        contractAwarderPersona: args.includeContractAwarderPersona?.value,
        supplierPersona: args.includeSupplierPersona?.value,
        factorPersona: args.includeFactorPersona?.value,
      },
    });
  };

  findById = async (
    id: number[],
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
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
      includeFactorPersona?: {
        value: boolean;
      };
    },
  ): Promise<Organization[]> => {
    return await this.organizationRepository.find({
      where: {
        id: In(id),
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: args.includeClientPersona?.value,
        contractAwarderPersona: args.includeContractAwarderPersona?.value,
        supplierPersona: args.includeSupplierPersona?.value,
        factorPersona: args.includeFactorPersona?.value,
      },
    });
  };

  findByClientPersonaId = async (
    clientPersonaId: number[],
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
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
    },
  ): Promise<Organization[]> => {
    return await this.organizationRepository.find({
      where: {
        clientPersonaId: In(clientPersonaId),
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: true,
        contractAwarderPersona: args.includeContractAwarderPersona?.value,
        supplierPersona: args.includeSupplierPersona?.value,
        factorPersona: args.includeFactorPersona?.value,
      },
    });
  };

  findByContractAwarderPersonaId = async (
    contractAwarderPersonaId: number[],
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
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
    },
  ): Promise<Organization[]> => {
    return await this.organizationRepository.find({
      where: {
        contractAwarderPersonaId: In(contractAwarderPersonaId),
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: args.includeClientPersona?.value,
        contractAwarderPersona: true,
        supplierPersona: args.includeSupplierPersona?.value,
        factorPersona: args.includeFactorPersona?.value,
      },
    });
  };

  findBySupplierPersonaId = async (
    supplierPersonaId: number[],
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
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
    },
  ): Promise<Organization[]> => {
    return await this.organizationRepository.find({
      where: {
        supplierPersonaId: In(supplierPersonaId),
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: args.includeClientPersona?.value,
        contractAwarderPersona: args.includeContractAwarderPersona?.value,
        supplierPersona: true,
        factorPersona: args.includeFactorPersona?.value,
      },
    });
  };

  findByFactorPersonaId = async (
    factorPersonaId: number[],
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
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
    },
  ): Promise<Organization[]> => {
    return await this.organizationRepository.find({
      where: {
        factorPersonaId: In(factorPersonaId),
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: args.includeClientPersona?.value,
        contractAwarderPersona: args.includeContractAwarderPersona?.value,
        supplierPersona: args.includeSupplierPersona?.value,
        factorPersona: true,
      },
    });
  };

  findByName = async (
    organizationName: string,
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includePerson?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
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
    },
  ): Promise<Organization[]> => {
    return await this.organizationRepository.findExcludeFactorPersona({
      where: {
        organizationName: organizationName
          ? ILike(`%${organizationName}%`)
          : undefined,
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              person: args.includeOrganizationPerson?.includePerson?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
        bankAccounts: args.includeBankAccount?.value,
        clientPersona: args.includeClientPersona?.value,
        contractAwarderPersona: args.includeContractAwarderPersona?.value,
        supplierPersona: args.includeSupplierPersona?.value,
      },
    });
  };

  createOrganization = async (
    args: UpdatableOrganization,
  ): Promise<Organization> => {
    const organization = new Organization({
      ...args,
    });

    return await this.organizationRepository.save(organization);
  };

  updateOrganization = async (
    id: number,
    args: UpdatableOrganization,
  ): Promise<Organization> => {
    return await this.organizationRepository.findOneAndUpdate({ id: id }, args);
  };

  createOrganizationEvent = async (
    args: CreateOrganizationMessage,
  ): Promise<CreateOrganizationMessageReply> => {
    const organization = new Organization({
      ...args.data,
      clientPersona: args.persona.isClient ? new ClientPersona() : undefined,
      contractAwarderPersona: args.persona.isContractAwarder
        ? new ContractAwarderPersona()
        : undefined,
      supplierPersona: args.persona.isSupplier
        ? new SupplierPersona()
        : undefined,
      factorPersona: args.persona.isFactor ? new FactorPersona() : undefined,
    });

    return await this.organizationRepository.save(organization);
  };

  updateOrganizationEvent = async (
    args:
      | UpdateOrganizationMessage
      | UpdateOrganizationByClientPersonaIdMessage
      | UpdateOrganizationByContractAwarderPersonaIdMessage
      | UpdateOrganizationBySupplierPersonaIdMessage
      | UpdateOrganizationByFactorPersonaIdMessage,
  ): Promise<UpdateOrganizationMessageReply> => {
    if ('id' in args) {
      return await this.organizationRepository.findOneAndUpdate(
        { id: args.id },
        args.data,
      );
    } else if ('clientPersonaId' in args) {
      return await this.organizationRepository.findOneAndUpdate(
        { clientPersonaId: args.clientPersonaId },
        args.data,
      );
    } else if ('contractAwarderPersonaId' in args) {
      return await this.organizationRepository.findOneAndUpdate(
        { contractAwarderPersonaId: args.contractAwarderPersonaId },
        args.data,
      );
    } else if ('supplierPersonaId' in args) {
      return await this.organizationRepository.findOneAndUpdate(
        { supplierPersonaId: args.supplierPersonaId },
        args.data,
      );
    } else if ('factorPersonaId' in args) {
      return await this.organizationRepository.findOneAndUpdate(
        { factorPersonaId: args.factorPersonaId },
        args.data,
      );
    }

    throw new Error('Invalid update organization message');
  };
}
