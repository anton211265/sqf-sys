import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import {
  ChangeRequestStatusEnum,
  ProposedWeightChange,
  RiskAuditEvent,
  RiskAuditLog,
  RiskProfileChangeRequest,
} from '../../models/risk-governance.entity';

export interface GovernanceContext {
  personId: number;
  orgId: number;
}

export interface CreateChangeRequestInput {
  riskProfileCode: string;
  weights: { weightId: number; newWeight: number }[];
  reason?: string;
}

/**
 * Maker-checker governance over risk profile weights. Weights themselves
 * live in risk_quantitative_profile_weight; this service never edits them
 * directly on request — only an approval applies the change, in one
 * transaction with the audit rows. Parameter-level weights must sum to 100
 * after the proposal (the scoring engine weights sub-scores by these).
 */
@Injectable()
export class RiskGovernanceService {
  constructor(
    @InjectRepository(RiskProfile)
    private readonly profileRepository: Repository<RiskProfile>,
    @InjectRepository(RiskQuantitativeProfileWeight)
    private readonly weightRepository: Repository<RiskQuantitativeProfileWeight>,
    @InjectRepository(RiskProfileChangeRequest)
    private readonly requestRepository: Repository<RiskProfileChangeRequest>,
    private readonly dataSource: DataSource,
  ) {}

  /** Lean read model for the weighting screen. */
  async listProfiles() {
    const profiles = await this.profileRepository.find({
      order: { id: 'ASC' },
    });
    return Promise.all(
      profiles.map(async (profile) => ({
        id: profile.id,
        riskProfileCode: profile.riskProfileCode,
        isDefault: profile.isDefault === 1,
        bands: {
          low: profile.lowRiskThresholds,
          medium: profile.mediumRiskThresholds,
          high: profile.highRiskThresholds,
        },
        weights: (await this.parameterWeights(profile.id)).map((w) => ({
          weightId: w.id,
          parameterName: w.quantitativeParameter?.name ?? `parameter #${w.quantitativeParameterId}`,
          weight: Number(w.weight),
        })),
      })),
    );
  }

  async listChangeRequests(status?: string) {
    return this.requestRepository.find({
      where: status ? { status: status as ChangeRequestStatusEnum } : {},
      order: { id: 'DESC' },
      take: 100,
    });
  }

  async createChangeRequest(
    ctx: GovernanceContext,
    input: CreateChangeRequestInput,
  ): Promise<RiskProfileChangeRequest> {
    const profile = await this.profileRepository.findOne({
      where: { riskProfileCode: input.riskProfileCode },
    });
    if (!profile) throw new NotFoundException('Risk profile not found');

    const pending = await this.requestRepository.findOne({
      where: { riskProfileId: profile.id, status: ChangeRequestStatusEnum.PENDING },
    });
    if (pending) {
      throw new ConflictException(
        `Change request #${pending.id} is already pending for ${profile.riskProfileCode}`,
      );
    }

    const currentWeights = await this.parameterWeights(profile.id);
    const byId = new Map(currentWeights.map((w) => [w.id, w]));
    const proposals: ProposedWeightChange[] = [];
    for (const change of input.weights) {
      const row = byId.get(change.weightId);
      if (!row) {
        throw new BadRequestException(
          `Weight ${change.weightId} is not a parameter-level weight of ${profile.riskProfileCode}`,
        );
      }
      proposals.push({
        weightId: row.id,
        parameterName: row.quantitativeParameter?.name ?? `parameter #${row.quantitativeParameterId}`,
        oldWeight: Number(row.weight),
        newWeight: change.newWeight,
      });
    }
    if (proposals.length === 0) {
      throw new BadRequestException('No weight changes proposed');
    }

    const proposedById = new Map(proposals.map((p) => [p.weightId, p.newWeight]));
    const total = currentWeights.reduce(
      (sum, w) => sum + (proposedById.get(w.id) ?? Number(w.weight)),
      0,
    );
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException(
        `Parameter weights must total 100 (proposal totals ${total})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const request = await manager.save(RiskProfileChangeRequest, {
        riskProfileId: profile.id,
        riskProfileCode: profile.riskProfileCode,
        proposedWeights: proposals,
        status: ChangeRequestStatusEnum.PENDING,
        requestedByPersonId: ctx.personId,
        requestedByOrgId: ctx.orgId,
        requestReason: input.reason ?? null,
      });
      await manager.insert(RiskAuditLog, {
        event: RiskAuditEvent.CHANGE_REQUESTED,
        riskProfileCode: profile.riskProfileCode,
        actorPersonId: ctx.personId,
        payload: {
          changeRequestId: request.id,
          proposedWeights: proposals,
          reason: input.reason ?? null,
        },
      });
      return request;
    });
  }

  async approve(ctx: GovernanceContext, id: number): Promise<RiskProfileChangeRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(RiskProfileChangeRequest, {
        where: { id },
      });
      if (!request) throw new NotFoundException('Change request not found');
      if (request.status !== ChangeRequestStatusEnum.PENDING) {
        throw new BadRequestException(`Change request is ${request.status}`);
      }
      // Maker-checker: flat keys allow one person to hold both edit and
      // approve — the same-person check is the code-side enforcement the
      // annotation calls for.
      if (request.requestedByPersonId === ctx.personId) {
        throw new BadRequestException(
          'Maker-checker violation: the proposer cannot approve their own change',
        );
      }

      for (const change of request.proposedWeights) {
        await manager.update(
          RiskQuantitativeProfileWeight,
          { id: change.weightId },
          { weight: change.newWeight },
        );
      }
      request.status = ChangeRequestStatusEnum.APPROVED;
      request.decidedByPersonId = ctx.personId;
      request.decidedAt = new Date();
      const saved = await manager.save(RiskProfileChangeRequest, request);

      await manager.insert(RiskAuditLog, {
        event: RiskAuditEvent.CHANGE_APPROVED,
        riskProfileCode: request.riskProfileCode,
        actorPersonId: ctx.personId,
        payload: {
          changeRequestId: request.id,
          requestedByPersonId: request.requestedByPersonId,
          appliedWeights: request.proposedWeights,
          reason: request.requestReason,
        },
      });
      return saved;
    });
  }

  async reject(
    ctx: GovernanceContext,
    id: number,
    note?: string,
  ): Promise<RiskProfileChangeRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(RiskProfileChangeRequest, {
        where: { id },
      });
      if (!request) throw new NotFoundException('Change request not found');
      if (request.status !== ChangeRequestStatusEnum.PENDING) {
        throw new BadRequestException(`Change request is ${request.status}`);
      }
      request.status = ChangeRequestStatusEnum.REJECTED;
      request.decidedByPersonId = ctx.personId;
      request.decidedAt = new Date();
      request.decisionNote = note ?? null;
      const saved = await manager.save(RiskProfileChangeRequest, request);

      await manager.insert(RiskAuditLog, {
        event: RiskAuditEvent.CHANGE_REJECTED,
        riskProfileCode: request.riskProfileCode,
        actorPersonId: ctx.personId,
        payload: {
          changeRequestId: request.id,
          requestedByPersonId: request.requestedByPersonId,
          note: note ?? null,
          reason: request.requestReason,
        },
      });
      return saved;
    });
  }

  private parameterWeights(riskProfileId: number) {
    return this.weightRepository.find({
      where: { riskProfileId, quantitativeSubParameterId: IsNull() },
      order: { id: 'ASC' },
    });
  }
}
