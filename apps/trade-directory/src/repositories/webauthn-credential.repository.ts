import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { WebauthnCredential } from '../models';

export class WebauthnCredentialRepository extends AbstractRepository<WebauthnCredential> {
  protected readonly logger = new Logger(WebauthnCredential.name);

  constructor(
    @InjectRepository(WebauthnCredential)
    repository: Repository<WebauthnCredential>,
    entityManager: EntityManager,
  ) {
    super(repository, entityManager);
  }

  findActiveByPersonId(personId: number): Promise<WebauthnCredential[]> {
    return this.find({
      where: { person: { id: personId }, revokedAt: IsNull() },
      relations: ['person'],
    });
  }

  findActiveByCredentialId(
    credentialId: string,
  ): Promise<WebauthnCredential | null> {
    return this.findOne({
      where: { credentialId, revokedAt: IsNull() },
      relations: ['person'],
    });
  }
}
