import { UpdatablePerson } from '@app/common/apps/trade-directory/types/person.type';
import { Injectable } from '@nestjs/common';
import { Person } from '../models';
import { PersonRepository } from '../repositories';
import { In } from 'typeorm';

@Injectable()
export class PersonService {
  constructor(private readonly personRepository: PersonRepository) {}

  getAll = async (args: {
    includeOrganizationPerson?: {
      value: boolean;
      includeOrganization?: {
        value: boolean;
      };
      includeOrganizationPersonRole?: {
        value: boolean;
      };
    };
  }): Promise<Person[]> => {
    return await this.personRepository.find({
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              organization:
                args.includeOrganizationPerson?.includeOrganization?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
      },
    });
  };

  findById = async (
    id: number[],
    args: {
      includeOrganizationPerson?: {
        value: boolean;
        includeOrganization?: {
          value: boolean;
        };
        includeOrganizationPersonRole?: {
          value: boolean;
        };
      };
    },
  ): Promise<Person[]> => {
    return await this.personRepository.find({
      where: {
        id: In(id),
      },
      relations: {
        organizationPersons: args.includeOrganizationPerson?.value
          ? {
              organization:
                args.includeOrganizationPerson?.includeOrganization?.value,
              organizationPersonRoles:
                args.includeOrganizationPerson?.includeOrganizationPersonRole
                  ?.value,
            }
          : undefined,
      },
    });
  };

  createPerson = async (args: UpdatablePerson): Promise<Person> => {
    const person = new Person({
      ...args,
    });

    return await this.personRepository.save(person);
  };

  updatePerson = async (id: number, args: UpdatablePerson): Promise<Person> => {
    return await this.personRepository.findOneAndUpdate({ id: id }, args);
  };
}
