import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { EntityManager } from 'typeorm';
import {
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  Person,
} from '../../models';
import { PersonRepository } from '../../repositories';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: OrganizationPersonRoleEnum;
  designation?: string;
}

@Injectable()
export class PersonService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly entityManager: EntityManager,
  ) {}

  async createUser(callerId: number, callerOrgId: number, dto: CreateUserDto) {
    const caller = await this.personRepository.findOne({
      where: { id: callerId },
      relations: [
        'organizationPersons',
        'organizationPersons.organizationPersonRoles',
      ],
    });

    const callerOrgPerson = caller?.organizationPersons?.find(
      (op) => op.organizationId === callerOrgId,
    );
    const callerRoles =
      callerOrgPerson?.organizationPersonRoles?.map((r) => r.role) ?? [];

    if (!callerRoles.includes(OrganizationPersonRoleEnum.SUPERUSER)) {
      throw new ForbiddenException('Only a Super User may create new users.');
    }

    const existing = await this.personRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        `A user with email ${dto.email} already exists.`,
      );
    }

    return this.entityManager.transaction(async (manager) => {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const person = manager.create(Person, {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      });
      const savedPerson = await manager.save(Person, person);

      const orgPersonRole = manager.create(OrganizationPersonRole, {
        role: dto.role,
      });
      const orgPerson = manager.create(OrganizationPerson, {
        person: savedPerson,
        organization: { id: callerOrgId } as Organization,
        designation: dto.designation,
        organizationPersonRoles: [orgPersonRole],
      });
      await manager.save(OrganizationPerson, orgPerson);

      return { id: savedPerson.id, name: savedPerson.name, email: savedPerson.email };
    });
  }

  async getLogInPersonDetail(id: number, orgId: number) {
    const person = await this.personRepository.findOne({
      where: { id },
      relations: [
        'organizationPersons',
        'organizationPersons.organization',
        'organizationPersons.organizationPersonRoles',
      ],
    });

    // SQFSYS users have no org membership — return minimal profile with their system role
    if (person.systemRole === 'SQFSYS') {
      return {
        id: person.id,
        name: person.name,
        email: person.email,
        organizationName: 'SQF System',
        fullyOnboardedAt: null,
        organizationPersonRoles: [{ role: 'SQFSYS' }],
      };
    }

    const selectedOrganizationPerson = person.organizationPersons.find(
      (organizationPerson) => organizationPerson.organization.id === orgId,
    );

    return {
      id: person.id,
      name: person.name,
      email: person.email,
      organizationId: selectedOrganizationPerson.organization.id,
      organizationName: selectedOrganizationPerson.organization.organizationName,
      fullyOnboardedAt: selectedOrganizationPerson.organization.fullyOnboardedAt,
      organizationPersonRoles: (selectedOrganizationPerson.organizationPersonRoles ?? []).map(
        (r) => ({ role: r.role }),
      ),
    };
  }
}
