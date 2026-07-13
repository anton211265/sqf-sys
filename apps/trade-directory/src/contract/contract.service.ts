import { ContractTypeEnum } from '@app/common/apps/trade-directory/enums/contract-type.enum';
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
import { Contract } from '../models/contract.entity';
import {
  ContractRepository,
  OrganizationRepository,
  OutboxEventRepository,
} from '../repositories';
import { CreateContractDto, UpdateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly entityManager: EntityManager,
  ) {}

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

  async create(user: IUserContext, dto: CreateContractDto) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);

    if (
      dto.contractType === ContractTypeEnum.FACILITY_AGREEMENT &&
      !dto.lendingProduct
    ) {
      throw new BadRequestException(
        'lendingProduct is required for FACILITY_AGREEMENT contracts',
      );
    }
    if (dto.contractType === ContractTypeEnum.COMMERCIAL && dto.lendingProduct) {
      throw new BadRequestException(
        'lendingProduct only applies to FACILITY_AGREEMENT contracts',
      );
    }

    const contract = new Contract({ ...dto, funderPersonaId });

    return this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(Contract, contract);
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.CONTRACT_UPSERTED,
        payload: { eventId: uuid(), ...saved },
      });
      return saved;
    });
  }

  async findAll(
    user: IUserContext,
    filters: { contractType?: string; organizationId?: number },
  ) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const base: Record<string, unknown> = { funderPersonaId };
    if (filters.contractType) base.contractType = filters.contractType;

    const where: Record<string, unknown>[] = filters.organizationId
      ? [
          { ...base, firstPartyOrganizationId: filters.organizationId },
          { ...base, secondPartyOrganizationId: filters.organizationId },
        ]
      : [base];

    return this.contractRepository.find({
      where,
      relations: ['firstPartyOrganization', 'secondPartyOrganization'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(user: IUserContext, id: number) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const contract = await this.contractRepository.findOne({
      where: { id, funderPersonaId },
      relations: [
        'firstPartyOrganization',
        'secondPartyOrganization',
        'relationship',
      ],
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    return contract;
  }

  async update(user: IUserContext, id: number, dto: UpdateContractDto) {
    const contract = await this.findById(user, id);
    Object.assign(contract, dto);

    return this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(Contract, contract);
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.CONTRACT_UPSERTED,
        payload: { eventId: uuid(), ...saved },
      });
      return saved;
    });
  }
}
