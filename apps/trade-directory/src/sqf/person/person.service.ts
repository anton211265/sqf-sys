import { Injectable } from '@nestjs/common';
import { PersonRepository } from '../../repositories';

@Injectable()
export class PersonService {
  constructor(private readonly personRepository: PersonRepository) {}

  async getLogInPersonDetail(id: number, orgId: number) {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: ['organizationPersons', 'organizationPersons.organization'],
    });

    const selectedOrganization = person.organizationPersons.find(
      (organizationPerson) => organizationPerson.organization.id === orgId,
    );

    const result = {
      id: person.id,
      name: person.name,
      email: person.email,
      organizationName: selectedOrganization.organization.organizationName,
      fullyOnboardedAt: selectedOrganization.organization.fullyOnboardedAt,
    };

    return result;
  }
}
