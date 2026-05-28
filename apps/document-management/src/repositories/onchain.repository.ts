import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Onchain } from '../models/onchain.entity';

@Injectable()
export class OnchainRepository extends AbstractRepository<Onchain> {
  protected readonly logger = new Logger(OnchainRepository.name);

  constructor(
    @InjectRepository(Onchain)
    onchainRepository: Repository<Onchain>,
    entityManager: EntityManager,
  ) {
    super(onchainRepository, entityManager);
  }
}
