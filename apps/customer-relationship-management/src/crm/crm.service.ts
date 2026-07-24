import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  Deal,
  DealStageEnum,
  DealStageHistory,
  Lead,
  LeadStatusEnum,
  SiteVisitReport,
} from '../models/crm.entity';
import { OutboxEventRepository } from '../repositories';

/** Set by RemotePermissionGuard; permissions lets handlers branch on scope. */
export interface CrmUserContext {
  id: number;
  orgId: number;
  permissions?: Set<string>;
  isSuperAdmin?: boolean;
}

/** The SLA template promotion starts (funders define it in the portal). */
export const RM_ONBOARDING_SLA_CODE = 'RM_ONBOARDING_RESPONSE';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Lead) private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Deal) private readonly dealRepository: Repository<Deal>,
    @InjectRepository(SiteVisitReport)
    private readonly siteVisitRepository: Repository<SiteVisitReport>,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dataSource: DataSource,
  ) {}

  /** "mine" under the pipeline gate; "team" additionally needs supervisor. */
  private resolveScope(user: CrmUserContext, scope?: string) {
    if (scope === 'team') {
      if (!user.isSuperAdmin && !user.permissions?.has('crm_supervisor_view')) {
        throw new ForbiddenException(
          'Team scope requires crm_supervisor_view',
        );
      }
      return { funderOrganizationId: user.orgId };
    }
    return { funderOrganizationId: user.orgId, ownerRmPersonId: user.id };
  }

  private assertFunder(user: CrmUserContext) {
    if (user.orgId === 0) {
      throw new BadRequestException('CRM data belongs to a funder organization');
    }
  }

  // ---- Leads ----

  async listLeads(user: CrmUserContext, scope?: string): Promise<Lead[]> {
    return this.leadRepository.find({
      where: this.resolveScope(user, scope),
      order: { updatedAt: 'DESC' },
      take: 500,
    });
  }

  async createLead(user: CrmUserContext, dto: Partial<Lead>): Promise<Lead> {
    this.assertFunder(user);
    return this.leadRepository.save({
      funderOrganizationId: user.orgId,
      companyName: dto.companyName,
      registrationNumber: dto.registrationNumber ?? null,
      contactName: dto.contactName ?? null,
      contactEmail: dto.contactEmail ?? null,
      contactPhone: dto.contactPhone ?? null,
      source: dto.source ?? null,
      notes: dto.notes ?? null,
      organizationId: dto.organizationId ?? null,
      ownerRmPersonId: user.id,
      status: LeadStatusEnum.LEAD,
    });
  }

  /** Own leads only, unless the caller holds the supervisor key. */
  private async getWritableLead(user: CrmUserContext, id: number): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, funderOrganizationId: user.orgId },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    const supervisor = user.isSuperAdmin || user.permissions?.has('crm_supervisor_view');
    if (!supervisor && lead.ownerRmPersonId !== user.id) {
      throw new ForbiddenException('Not your lead — supervisors can act on any');
    }
    return lead;
  }

  async updateLead(
    user: CrmUserContext,
    id: number,
    dto: Partial<Lead> & { status?: LeadStatusEnum },
  ): Promise<Lead> {
    const lead = await this.getWritableLead(user, id);
    if (lead.status === LeadStatusEnum.PROMOTED) {
      throw new BadRequestException('Promoted leads are read-only in CRM');
    }
    if (dto.status !== undefined && dto.status !== lead.status) {
      const allowed: Record<string, LeadStatusEnum[]> = {
        [LeadStatusEnum.LEAD]: [LeadStatusEnum.PROSPECT, LeadStatusEnum.CLOSED],
        [LeadStatusEnum.PROSPECT]: [LeadStatusEnum.CLOSED, LeadStatusEnum.LEAD],
        [LeadStatusEnum.CLOSED]: [LeadStatusEnum.LEAD],
      };
      if (!allowed[lead.status]?.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot move lead from ${lead.status} to ${dto.status}`,
        );
      }
      lead.status = dto.status;
      if (dto.status === LeadStatusEnum.PROSPECT) lead.qualifiedAt = new Date();
      if (dto.status === LeadStatusEnum.CLOSED) lead.closedAt = new Date();
    }
    for (const field of [
      'companyName',
      'registrationNumber',
      'contactName',
      'contactEmail',
      'contactPhone',
      'source',
      'notes',
      'organizationId',
    ] as const) {
      if (dto[field] !== undefined) (lead as never as Record<string, unknown>)[field] = dto[field];
    }
    return this.leadRepository.save(lead);
  }

  async assignLead(user: CrmUserContext, id: number, rmPersonId: number): Promise<Lead> {
    this.assertFunder(user);
    const lead = await this.leadRepository.findOne({
      where: { id, funderOrganizationId: user.orgId },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.ownerRmPersonId = rmPersonId;
    return this.leadRepository.save(lead);
  }

  /**
   * Promote prospect → applicant (Section-1 process 4, CRM side): marks the
   * lead PROMOTED and, in the same transaction, writes the onboarding
   * invite (SEND_EMAIL, stub link until the Customer Portal exists) and the
   * response-window SLA start (SLA_TIMER_START — the SLA engine consumes it
   * today; unknown template codes are logged and dropped there, so funders
   * that haven't defined RM_ONBOARDING_RESPONSE lose nothing).
   */
  async promoteLead(user: CrmUserContext, id: number): Promise<Lead> {
    const lead = await this.getWritableLead(user, id);
    if (lead.status !== LeadStatusEnum.PROSPECT) {
      throw new BadRequestException('Only PROSPECT leads can be promoted');
    }
    return this.dataSource.transaction(async (manager) => {
      lead.status = LeadStatusEnum.PROMOTED;
      lead.promotedAt = new Date();
      const saved = await manager.save(Lead, lead);

      if (lead.contactEmail) {
        await this.outboxEventRepository.record(manager, {
          id: randomUUID(),
          topic: KafkaTopicEnum.SEND_EMAIL,
          payload: {
            eventId: randomUUID(),
            emailSender: 'notification@sqf.ai',
            emailReceivers: [lead.contactEmail],
            emailCc: [],
            emailBcc: [],
            emailReplyTo: [],
            emailSubject: 'SQF.AI - Complete your financing application',
            emailBody:
              `<p>Dear ${lead.contactName ?? lead.companyName},</p>` +
              `<p>Your relationship manager has initiated a financing application for ` +
              `<strong>${lead.companyName}</strong>. Please continue your onboarding here:</p>` +
              `<p><a href="http://localhost:3001/onboarding">Start onboarding</a> ` +
              `(placeholder link — Customer Portal pending)</p>`,
          },
        });
      }
      await this.outboxEventRepository.record(manager, {
        id: randomUUID(),
        topic: KafkaTopicEnum.SLA_TIMER_START,
        payload: {
          eventId: randomUUID(),
          funderOrganizationId: lead.funderOrganizationId,
          slaCode: RM_ONBOARDING_SLA_CODE,
          subjectType: 'LEAD',
          subjectId: String(lead.id),
          context: { companyName: lead.companyName, ownerRmPersonId: lead.ownerRmPersonId },
        },
      });
      return saved;
    });
  }

  // ---- Deals ----

  async listDeals(user: CrmUserContext, scope?: string): Promise<Deal[]> {
    return this.dealRepository.find({
      where: this.resolveScope(user, scope),
      relations: ['lead'],
      order: { updatedAt: 'DESC' },
      take: 500,
    });
  }

  async createDeal(
    user: CrmUserContext,
    dto: {
      leadId: number;
      title: string;
      productCode?: string;
      dealValue?: number;
      expectedCloseDate?: string;
      notes?: string;
    },
  ): Promise<Deal> {
    const lead = await this.getWritableLead(user, dto.leadId);
    return this.dataSource.transaction(async (manager) => {
      const deal = await manager.save(Deal, {
        funderOrganizationId: user.orgId,
        leadId: lead.id,
        ownerRmPersonId: lead.ownerRmPersonId,
        title: dto.title,
        productCode: dto.productCode ?? null,
        dealValue: dto.dealValue !== undefined && dto.dealValue !== null ? String(dto.dealValue) : null,
        expectedCloseDate: dto.expectedCloseDate ?? null,
        notes: dto.notes ?? null,
        stage: DealStageEnum.QUALIFIED,
      });
      await manager.insert(DealStageHistory, {
        dealId: deal.id,
        fromStage: null,
        toStage: DealStageEnum.QUALIFIED,
        movedByPersonId: user.id,
      });
      return deal;
    });
  }

  async updateDeal(
    user: CrmUserContext,
    id: number,
    dto: {
      title?: string;
      productCode?: string;
      dealValue?: number | null;
      expectedCloseDate?: string;
      notes?: string;
      stage?: DealStageEnum;
    },
  ): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id, funderOrganizationId: user.orgId },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    const supervisor = user.isSuperAdmin || user.permissions?.has('crm_supervisor_view');
    if (!supervisor && deal.ownerRmPersonId !== user.id) {
      throw new ForbiddenException('Not your deal — supervisors can act on any');
    }
    return this.dataSource.transaction(async (manager) => {
      if (dto.stage !== undefined && dto.stage !== deal.stage) {
        if (deal.closedAt) {
          throw new BadRequestException('Closed deals cannot change stage');
        }
        if (!Object.values(DealStageEnum).includes(dto.stage)) {
          throw new BadRequestException(`Unknown stage ${dto.stage}`);
        }
        await manager.insert(DealStageHistory, {
          dealId: deal.id,
          fromStage: deal.stage,
          toStage: dto.stage,
          movedByPersonId: user.id,
        });
        deal.stage = dto.stage;
        if (dto.stage === DealStageEnum.WON || dto.stage === DealStageEnum.LOST) {
          deal.closedAt = new Date();
        }
      }
      for (const field of ['title', 'productCode', 'expectedCloseDate', 'notes'] as const) {
        if (dto[field] !== undefined) (deal as never as Record<string, unknown>)[field] = dto[field];
      }
      if (dto.dealValue !== undefined) {
        deal.dealValue = dto.dealValue === null ? null : String(dto.dealValue);
      }
      return manager.save(Deal, deal);
    });
  }

  // ---- Site visits ----

  async listSiteVisits(user: CrmUserContext, scope?: string): Promise<SiteVisitReport[]> {
    const where =
      scope === 'team'
        ? this.resolveScope(user, 'team')
        : { funderOrganizationId: user.orgId, reportedByPersonId: user.id };
    return this.siteVisitRepository.find({
      where,
      order: { visitedAt: 'DESC' },
      take: 500,
    });
  }

  async createSiteVisit(
    user: CrmUserContext,
    dto: Partial<SiteVisitReport> & { visitedAt: string; summary: string },
  ): Promise<SiteVisitReport> {
    this.assertFunder(user);
    return this.siteVisitRepository.save({
      funderOrganizationId: user.orgId,
      leadId: dto.leadId ?? null,
      organizationId: dto.organizationId ?? null,
      visitedAt: dto.visitedAt,
      summary: dto.summary,
      findings: dto.findings ?? null,
      reportedByPersonId: user.id,
    });
  }

  // ---- Supervisor performance ----

  /** Per-RM funnel aggregates + conversion (annotation: prospects÷leads,
   * won÷prospects), computed from CRM rows only. */
  async performance(user: CrmUserContext) {
    const leads = await this.leadRepository.find({
      where: { funderOrganizationId: user.orgId },
    });
    const deals = await this.dealRepository.find({
      where: { funderOrganizationId: user.orgId },
    });
    const byRm = new Map<number, {
      rmPersonId: number;
      leads: number;
      prospects: number;
      promoted: number;
      dealsOpen: number;
      dealsWon: number;
      dealsLost: number;
      pipelineValue: number;
    }>();
    const row = (rmPersonId: number) => {
      if (!byRm.has(rmPersonId)) {
        byRm.set(rmPersonId, {
          rmPersonId,
          leads: 0,
          prospects: 0,
          promoted: 0,
          dealsOpen: 0,
          dealsWon: 0,
          dealsLost: 0,
          pipelineValue: 0,
        });
      }
      return byRm.get(rmPersonId);
    };
    for (const lead of leads) {
      const r = row(lead.ownerRmPersonId);
      r.leads += 1;
      if (lead.status === LeadStatusEnum.PROSPECT) r.prospects += 1;
      if (lead.status === LeadStatusEnum.PROMOTED) r.promoted += 1;
    }
    for (const deal of deals) {
      const r = row(deal.ownerRmPersonId);
      if (deal.stage === DealStageEnum.WON) r.dealsWon += 1;
      else if (deal.stage === DealStageEnum.LOST) r.dealsLost += 1;
      else {
        r.dealsOpen += 1;
        r.pipelineValue += deal.dealValue ? parseFloat(deal.dealValue) : 0;
      }
    }
    return [...byRm.values()].map((r) => ({
      ...r,
      qualificationRate: r.leads > 0 ? (r.prospects + r.promoted) / r.leads : 0,
      winRate:
        r.dealsWon + r.dealsLost > 0 ? r.dealsWon / (r.dealsWon + r.dealsLost) : 0,
    }));
  }
}
