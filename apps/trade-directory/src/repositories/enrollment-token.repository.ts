import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { EnrollmentToken } from '../models';

export class EnrollmentTokenRepository extends AbstractRepository<EnrollmentToken> {
  protected readonly logger = new Logger(EnrollmentToken.name);

  constructor(
    @InjectRepository(EnrollmentToken)
    repository: Repository<EnrollmentToken>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  findUsableByTokenHash(tokenHash: string): Promise<EnrollmentToken | null> {
    return this.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThanOrEqual(new Date()),
      },
      relations: ['person'],
    });
  }
}
