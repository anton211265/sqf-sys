import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindManyOptions,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { Organization } from '../models';

export class OrganizationRepository extends AbstractRepository<Organization> {
  protected readonly logger = new Logger(Organization.name);

  constructor(
    @InjectRepository(Organization)
    repository: Repository<Organization>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  async findExcludeFunderPersona(
    options?: FindManyOptions<Organization>,
  ): Promise<Organization[]> {
    return await super.find({
      ...options,
      where: [
        {
          ...options.where,
          clientPersona: Not(IsNull()),
        },
        {
          ...options.where,
          buyerPersona: Not(IsNull()),
        },
        {
          ...options.where,
          supplierPersona: Not(IsNull()),
        },
        {
          ...options.where,
          funderPersona: IsNull(),
        },
      ],
    });
  }

  async findAndCountExcludeFunderPersona(
    options?: FindManyOptions<Organization>,
  ): Promise<[Organization[], number]> {
    return await super.findAndCount({
      ...options,
      where: [
        {
          ...options.where,
          clientPersona: Not(IsNull()),
        },
        {
          ...options.where,
          buyerPersona: Not(IsNull()),
        },
        {
          ...options.where,
          supplierPersona: Not(IsNull()),
        },
        {
          ...options.where,
          funderPersona: IsNull(),
        },
      ],
    });
  }
}
