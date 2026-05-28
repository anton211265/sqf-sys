import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ApiKey } from '../models/api-key.entity';

@Injectable()
export class ApiKeyRepository extends AbstractRepository<ApiKey> {
  protected readonly logger = new Logger(ApiKeyRepository.name);

  constructor(
    @InjectRepository(ApiKey)
    apiKeyRepository: Repository<ApiKey>,
    entityManager: EntityManager,
  ) {
    super(apiKeyRepository, entityManager);
  }
}
