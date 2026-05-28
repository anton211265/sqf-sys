import { Logger, NotFoundException } from '@nestjs/common';
import {
  DeleteResult,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AbstractEntity } from './abstract.entity';

export abstract class AbstractRepository<T extends AbstractEntity<T>> {
  protected abstract readonly logger: Logger;

  constructor(
    private readonly itemsRepository: Repository<T>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(entity: T): Promise<T> {
    return await this.entityManager.save(entity);
  }

  async save(entity: T): Promise<T> {
    return await this.itemsRepository.save(entity);
  }

  async saveMany(entities: T[]): Promise<T[]> {
    return await this.itemsRepository.save(entities);
  }

  async findOneOrThrowException(options: FindOneOptions<T>): Promise<T> {
    const entity = await this.itemsRepository.findOne(options);

    if (!entity) {
      this.logger.warn('Entity not found with where', options.where);
      throw new NotFoundException('Entity not found.');
    }

    return entity;
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.itemsRepository.findOne(options);
  }

  async findOneAndUpdate(
    where: FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<T> {
    const updateResult = await this.itemsRepository.update(
      where,
      partialEntity,
    );

    if (!updateResult.affected) {
      this.logger.warn('Entity not found with where', where);
      throw new NotFoundException('Entity not found.');
    }

    return await this.findOneOrThrowException({ where });
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.itemsRepository.find(options);
  }

  async findBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<T[]> {
    return this.itemsRepository.findBy(where);
  }

  async findOneAndDelete(criteria: FindOptionsWhere<T>): Promise<DeleteResult> {
    return await this.itemsRepository.delete(criteria);
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.itemsRepository.findAndCount(options);
  }

  async update(
    criteria: FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    return await this.itemsRepository.update(criteria, partialEntity);
  }

  async delete(criteria: FindOptionsWhere<T>): Promise<DeleteResult> {
    return await this.itemsRepository.delete(criteria);
  }

  async upsert(upsertCondition: FindOptionsWhere<T>, entity: T): Promise<T> {
    const existingEntity = await this.itemsRepository.findOne({
      where: upsertCondition,
    });

    if (!existingEntity) {
      this.logger.log('Entity not found, creating entity');
      return await this.create(entity);
    }

    entity.id = existingEntity.id;
    return await this.save(entity);
  }

  createQueryBuilder(
    alias?: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<T> {
    return this.itemsRepository.createQueryBuilder(alias, queryRunner);
  }
}
