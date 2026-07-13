import { RelationshipTypeEnum } from '@app/common/apps/trade-directory/enums/relationship-type.enum';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Relationship } from '../models/relationship.entity';
import {
  OrganizationRepository,
  OutboxEventRepository,
  RelationshipRepository,
} from '../repositories';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
} from './dto/create-relationship.dto';

@Injectable()
export class RelationshipService {
  constructor(
    private readonly relationshipRepository: RelationshipRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly entityManager: EntityManager,
  ) {}

  // Tenant scoping: the caller must belong to the funder organization; every
  // row is stamped with that funder's persona id. (Dynamic RBAC will refine
  // this per-role — see CLAUDE.md "Planned: Dynamic RBAC".)
  private async resolveFunderPersonaId(user: IUserContext): Promise<number> {
    const callerOrganization = await this.organizationRepository.findOne({
      where: { id: user.orgId },
    });
    if (!callerOrganization?.funderPersonaId) {
      throw new ForbiddenException(
        'Caller organization is not a funder organization',
      );
    }
    return callerOrganization.funderPersonaId;
  }

  async create(user: IUserContext, dto: CreateRelationshipDto) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);

    if (dto.fromOrganizationId === dto.toOrganizationId) {
      throw new BadRequestException(
        'fromOrganizationId and toOrganizationId must differ',
      );
    }

    for (const orgId of [dto.fromOrganizationId, dto.toOrganizationId]) {
      const organization = await this.organizationRepository.findOne({
        where: { id: orgId },
      });
      if (!organization) {
        throw new NotFoundException(`Organization ${orgId} not found`);
      }
    }

    const relationship = new Relationship({
      ...dto,
      relationshipType: dto.relationshipType ?? RelationshipTypeEnum.SUPPLIES_TO,
      funderPersonaId,
    });

    return this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(Relationship, relationship);
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.RELATIONSHIP_UPSERTED,
        payload: { eventId: uuid(), ...saved },
      });
      return saved;
    });
  }

  async findAll(
    user: IUserContext,
    filters: { organizationId?: number; status?: string },
  ) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const where: Record<string, unknown>[] = [];
    const base: Record<string, unknown> = { funderPersonaId };
    if (filters.status) base.status = filters.status;

    if (filters.organizationId) {
      where.push(
        { ...base, fromOrganizationId: filters.organizationId },
        { ...base, toOrganizationId: filters.organizationId },
      );
    } else {
      where.push(base);
    }

    return this.relationshipRepository.find({
      where,
      relations: ['fromOrganization', 'toOrganization'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(user: IUserContext, id: number) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const relationship = await this.relationshipRepository.findOne({
      where: { id, funderPersonaId },
      relations: ['fromOrganization', 'toOrganization'],
    });
    if (!relationship) {
      throw new NotFoundException(`Relationship ${id} not found`);
    }
    return relationship;
  }

  async update(user: IUserContext, id: number, dto: UpdateRelationshipDto) {
    const relationship = await this.findById(user, id);
    Object.assign(relationship, dto);

    return this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(Relationship, relationship);
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.RELATIONSHIP_UPSERTED,
        payload: { eventId: uuid(), ...saved },
      });
      return saved;
    });
  }
}
