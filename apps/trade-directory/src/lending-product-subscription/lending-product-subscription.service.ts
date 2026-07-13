import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LendingProductSubscription } from '../models/lending-product-subscription.entity';
import {
  ClientPersonaRepository,
  LendingProductSubscriptionRepository,
  OrganizationRepository,
} from '../repositories';
import {
  CreateLendingProductSubscriptionDto,
  UpdateLendingProductSubscriptionDto,
} from './dto/create-lending-product-subscription.dto';

@Injectable()
export class LendingProductSubscriptionService {
  constructor(
    private readonly subscriptionRepository: LendingProductSubscriptionRepository,
    private readonly clientPersonaRepository: ClientPersonaRepository,
    private readonly organizationRepository: OrganizationRepository,
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

  async create(user: IUserContext, dto: CreateLendingProductSubscriptionDto) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);

    const clientPersona = await this.clientPersonaRepository.findOne({
      where: { id: dto.clientPersonaId },
    });
    if (!clientPersona) {
      throw new NotFoundException(
        `Client persona ${dto.clientPersonaId} not found`,
      );
    }

    const existing = await this.subscriptionRepository.findOne({
      where: { clientPersonaId: dto.clientPersonaId, product: dto.product },
    });
    if (existing) {
      throw new ConflictException(
        `Client ${dto.clientPersonaId} is already subscribed to ${dto.product}`,
      );
    }

    return this.subscriptionRepository.create(
      new LendingProductSubscription({ ...dto, funderPersonaId }),
    );
  }

  async findAll(user: IUserContext, filters: { clientPersonaId?: number }) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const where: Record<string, unknown> = { funderPersonaId };
    if (filters.clientPersonaId) where.clientPersonaId = filters.clientPersonaId;

    return this.subscriptionRepository.find({
      where,
      relations: ['clientPersona', 'facilityContract'],
      order: { updatedAt: 'DESC' },
    });
  }

  async update(
    user: IUserContext,
    id: number,
    dto: UpdateLendingProductSubscriptionDto,
  ) {
    const funderPersonaId = await this.resolveFunderPersonaId(user);
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, funderPersonaId },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    Object.assign(subscription, dto);
    return this.subscriptionRepository.save(subscription);
  }
}
