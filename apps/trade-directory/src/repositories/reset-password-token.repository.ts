import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common/database/abstract.repository';
import { ResetPasswordToken } from '../models';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ResetPasswordTokenRepository extends AbstractRepository<ResetPasswordToken> {
  protected readonly logger = new Logger(ResetPasswordTokenRepository.name);

  constructor(
    @InjectRepository(ResetPasswordToken)
    resetRepository: Repository<ResetPasswordToken>,
    entityManager: EntityManager,
  ) {
    super(resetRepository, entityManager);
  }
}
