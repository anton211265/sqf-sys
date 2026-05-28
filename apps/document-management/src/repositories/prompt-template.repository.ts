import { AbstractRepository } from '@app/common/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PromptTemplate } from '../models/prompt-template.entity';

@Injectable()
export class PromptTemplateRepository extends AbstractRepository<PromptTemplate> {
  protected readonly logger = new Logger(PromptTemplateRepository.name);

  constructor(
    @InjectRepository(PromptTemplate)
    promptTemplateRepository: Repository<PromptTemplate>,
    entityManager: EntityManager,
  ) {
    super(promptTemplateRepository, entityManager);
  }
}
