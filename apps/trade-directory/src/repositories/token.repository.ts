import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { Token } from '../models';

export class TokenRepository extends AbstractRepository<Token> {
  protected readonly logger = new Logger(Token.name);

  constructor(
    @InjectRepository(Token)
    repository: Repository<Token>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  findActiveByPersonId(personId: number): Promise<Token[]> {
    return this.find({
      where: { person: { id: personId }, revokedAt: IsNull() },
      relations: ['person'],
    });
  }

  findRevokedByPersonId(personId: number): Promise<Token[]> {
    return this.find({
      where: { person: { id: personId }, revokedAt: Not(IsNull()) },
      relations: ['person'],
    });
  }

  findActiveByFamilyId(tokenFamilyId: string): Promise<Token[]> {
    return this.find({
      where: { tokenFamilyId, revokedAt: IsNull() },
      relations: ['person'],
    });
  }

  async deleteRevokedBefore(cutoff: Date): Promise<void> {
    await this.createQueryBuilder()
      .delete()
      .where('"revokedAt" IS NOT NULL AND "revokedAt" < :cutoff', { cutoff })
      .execute();
  }
}
