import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { UpdatableOrganizationPerson } from '@app/common/apps/trade-directory/types/organization-person.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ILike } from 'typeorm';
import { OrganizationPerson, OrganizationPersonRole } from '../models';
import {
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';

type GetFactorOrganizationPersonsArgs = {
  name?: string;
  pageSize?: number;
  pageNumber?: number;
};

type UpdateFactorOrganizationPersonRoleArgs = {
  organizationPersonId: number;
  roles: OrganizationPersonRoleEnum[];
};

type GetOrganizationPersonsArgs = {
  name?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class OrganizationPersonService {
  private readonly ENTRA_TENANT_ID: string;

  constructor(
    private readonly organizationPersonRepository: OrganizationPersonRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly personRepository: PersonRepository,
    private readonly configService: ConfigService,
  ) {
    this.ENTRA_TENANT_ID = this.configService.getOrThrow('ENTRA_TENANT_ID');
  }

  getFactorOrganizationPersons = async ({
    name,
    pageSize = 50,
    pageNumber = 1,
  }: GetFactorOrganizationPersonsArgs) => {
    const [organizationPersons, totalCount] =
      await this.organizationPersonRepository.findAndCount({
        where: {
          organization: {
            organizationName: this.ENTRA_TENANT_ID,
          },
          person: { name: name ? ILike(`%${name}%`) : undefined },
        },
        relations: {
          person: true,
          organizationPersonRoles: true,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      organizationPersons,
      pageNumber,
      pageSize,
      currentCount: Math.min(organizationPersons.length, pageSize),
      totalCount,
    };
  };

  updateFactorOrganizationPersonRole = async ({
    organizationPersonId,
    roles,
  }: UpdateFactorOrganizationPersonRoleArgs) => {
    let organizationPerson =
      await this.organizationPersonRepository.findOneOrThrowException({
        where: { id: organizationPersonId },
        relations: {
          organization: true,
          organizationPersonRoles: true,
          person: true,
        },
      });

    if (
      organizationPerson.organization.organizationName !== this.ENTRA_TENANT_ID
    ) {
      throw new Error('User is not from factor organization');
    }

    organizationPerson.organizationPersonRoles = roles.map(
      (r) => new OrganizationPersonRole({ role: r }),
    );

    organizationPerson =
      await this.organizationPersonRepository.save(organizationPerson);
    organizationPerson.organization = undefined;
    return organizationPerson;
  };

  getOrganizationPersons = async (
    filter: { organizationId?: number; clientPersonaId?: number },
    { name, pageSize = 50, pageNumber = 1 }: GetOrganizationPersonsArgs,
  ) => {
    const [organizationPersons, totalCount] =
      await this.organizationPersonRepository.findAndCount({
        where: {
          organization: {
            id: filter.organizationId,
            clientPersonaId: filter.clientPersonaId,
          },
          person: { name: name ? ILike(`%${name}%`) : undefined },
        },
        relations: {
          person: true,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      organizationPersons,
      pageNumber,
      pageSize,
      currentCount: Math.min(organizationPersons.length, pageSize),
      totalCount,
    };
  };

  findByOrganizationId = async (
    organizationId: number,
    args: {
      includeOrganization?: {
        value: boolean;
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
        includeBankAccount?: {
          value: boolean;
        };
      };
      includePerson?: {
        value: boolean;
      };
    },
  ): Promise<OrganizationPerson[]> => {
    return await this.organizationPersonRepository.find({
      where: {
        organization: {
          id: organizationId,
        },
      },
      relations: {
        organization: args.includeOrganization?.value
          ? {
              clientPersona:
                args.includeOrganization?.includeClientPersona?.value,
              contractAwarderPersona:
                args.includeOrganization?.includeContractAwarderPersona?.value,
              supplierPersona:
                args.includeOrganization?.includeSupplierPersona?.value,
              factorPersona:
                args.includeOrganization?.includeFactorPersona?.value,
              bankAccounts: args.includeOrganization?.includeBankAccount?.value,
            }
          : undefined,
        person: args.includePerson?.value,
      },
    });
  };

  createOrganizationPerson = async (
    organizationId: number,
    personId: number,
    args: UpdatableOrganizationPerson,
  ): Promise<OrganizationPerson> => {
    const organization =
      await this.organizationRepository.findOneOrThrowException({
        where: { id: organizationId },
      });

    const person = await this.personRepository.findOneOrThrowException({
      where: { id: personId },
    });

    const organizationPerson = new OrganizationPerson({
      ...args,
      organization,
      person,
    });

    return await this.organizationPersonRepository.save(organizationPerson);
  };

  updateOrganizationPerson = async (
    id: number,
    args: UpdatableOrganizationPerson,
  ): Promise<OrganizationPerson> => {
    return await this.organizationPersonRepository.findOneAndUpdate(
      { id: id },
      args,
    );
  };
}
