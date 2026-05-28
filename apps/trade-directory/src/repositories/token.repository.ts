import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
}
