import {
  BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Application } from '../../models/application.entity';
import { OfferStatusEnum, ProvisionalOffer, RateCardMirror } from '../../models/provisional-offer.entity';
import { RiskAuditLog } from '../../models/risk-governance.entity';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { PRODUCT_SCENARIOS, ScenarioType, simulate, SimulatorInputs } from './cashflow-simulator';

export const CRA_OFFER_SLA_CODE = 'CRA_PROVISIONAL_OFFER';
export const OFFER_ACCEPTANCE_SLA_CODE = 'OFFER_ACCEPTANCE';

interface Ctx { personId: number; orgId: number }

/**
 * Provisional Offer workspace (CRC pass 2, 2026-07-24) — the CRA's
 * maker-checker-approver chain per blueprint §1: DRAFT -> PENDING_CHECK ->
 * CHECKED -> APPROVED (auto-SENT with the acceptance SLA) -> ACCEPTED /
 * DECLINED / LAPSED. Simulator defaults come from the rate-card mirror
 * (Kafka-fed); every CRA override of a default is recorded.
 */
@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    @InjectRepository(ProvisionalOffer) private readonly offerRepository: Repository<ProvisionalOffer>,
    @InjectRepository(RateCardMirror) private readonly mirrorRepository: Repository<RateCardMirror>,
    @InjectRepository(Application) private readonly applicationRepository: Repository<Application>,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly dataSource: DataSource,
  ) {}

  async upsertMirror(event: any): Promise<void> {
    const existing = await this.mirrorRepository.findOne({
      where: { funderOrganizationId: event.funderOrganizationId, productCode: event.productCode },
    });
    const row = existing ?? this.mirrorRepository.create({
      funderOrganizationId: event.funderOrganizationId, productCode: event.productCode,
    });
    row.rateCardId = event.rateCardId ?? null;
    row.version = event.versionNumber ?? null;
    row.params = event.params ?? {};
    await this.mirrorRepository.save(row);
  }

  /** Map mirrored card params to simulator defaults for the scenario. */
  private defaultsFor(scenario: ScenarioType, params: Record<string, any>): SimulatorInputs {
    const n = (v: any) => (v === null || v === undefined ? undefined : Number(v));
    const base: SimulatorInputs = {
      processingFeeOnApplication: n(params.oneTimeAdminFee),
      dayCountBase: 365,
    };
    if (scenario === 'TERM_LOAN') {
      return {
        ...base,
        tlRateFlatMonthly: n(params.interestRateApr) !== undefined ? Number(params.interestRateApr) / 12 : undefined,
        tlProcessingFeeRate: n(params.discountFeePct),
        tlConvention: 'FLAT',
      };
    }
    if (scenario === 'SCF') {
      return { ...base, scfAdvanceRate: n(params.advanceRatePct) ?? 1.0, scfDiscountRatePa: n(params.interestRateApr) };
    }
    return {
      ...base,
      advanceRate: n(params.advanceRatePct),
      adminFeeRate: n(params.discountFeePct),
      profitRatePa: n(params.interestRateApr),
      collectionPeriodMonths: 2,
    };
  }

  simulatePreview(scenario: ScenarioType, inputs: SimulatorInputs) {
    if (!PRODUCT_SCENARIOS && !scenario) throw new BadRequestException('scenario required');
    return simulate(scenario, inputs ?? {});
  }

  async list(ctx: Ctx) {
    const qb = this.offerRepository.createQueryBuilder('o').orderBy('o.updatedAt', 'DESC').take(200);
    if (ctx.orgId !== 0) qb.where('o.funder_organization_id = :orgId', { orgId: ctx.orgId });
    return qb.getMany();
  }

  async get(ctx: Ctx, id: number) {
    const offer = await this.offerRepository.findOne({ where: { id } });
    if (!offer || (ctx.orgId !== 0 && offer.funderOrganizationId !== ctx.orgId)) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  /** CRA picks an application from the CRC bucket — creates the offer,
   * moves the application to IN_CRC_REVIEW and starts the CRA SLA. */
  async create(ctx: Ctx, applicationId: number) {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application || (ctx.orgId !== 0 && application.funderOrganizationId !== ctx.orgId)) {
      throw new NotFoundException('Application not found');
    }
    if (![ApplicationStatusEnum.SCORED_PASS, ApplicationStatusEnum.IN_CRC_REVIEW].includes(application.applicationStatus)) {
      throw new BadRequestException('Only passed applications can enter the provisional-offer stage');
    }
    const scenario = PRODUCT_SCENARIOS[application.productCode ?? ''] ?? 'POST_FACTORING';
    const mirror = await this.mirrorRepository.findOne({
      where: { funderOrganizationId: application.funderOrganizationId!, productCode: application.productCode! },
    });
    const defaults = this.defaultsFor(scenario, mirror?.params ?? {});

    return this.dataSource.transaction(async (manager) => {
      const offer = await manager.save(ProvisionalOffer, manager.create(ProvisionalOffer, {
        funderOrganizationId: application.funderOrganizationId!,
        applicationId: application.id,
        organizationId: application.organizationId,
        companyName: application.clientOrganizationName,
        productCode: application.productCode!,
        scenario,
        rateCardSnapshot: mirror ? { rateCardId: mirror.rateCardId, version: mirror.version, params: mirror.params } : null,
        inputs: defaults as Record<string, any>,
        makerPersonId: ctx.personId,
      }));
      application.applicationStatus = ApplicationStatusEnum.IN_CRC_REVIEW;
      await manager.save(Application, application);
      await this.slaEvent(manager, KafkaTopicEnum.SLA_TIMER_START, CRA_OFFER_SLA_CODE, offer);
      await this.audit(manager, 'OFFER_CREATED', offer, ctx, { applicationId });
      return offer;
    });
  }

  async save(ctx: Ctx, id: number, inputs: SimulatorInputs) {
    const offer = await this.get(ctx, id);
    if (offer.status !== OfferStatusEnum.DRAFT) throw new BadRequestException('Only DRAFT offers can be edited');
    const defaults = this.defaultsFor(offer.scenario as ScenarioType, offer.rateCardSnapshot?.params ?? {});
    const overrides: Record<string, any> = {};
    for (const [key, def] of Object.entries(defaults)) {
      const value = (inputs as any)[key];
      if (def !== undefined && value !== undefined && Number(value) !== Number(def)) {
        overrides[key] = { default: def, value };
      }
    }
    offer.inputs = inputs as Record<string, any>;
    offer.overrides = Object.keys(overrides).length ? overrides : null;
    offer.outputs = simulate(offer.scenario as ScenarioType, inputs) as unknown as Record<string, any>;
    await this.offerRepository.save(offer);
    return offer;
  }

  async submit(ctx: Ctx, id: number) {
    const offer = await this.get(ctx, id);
    if (offer.status !== OfferStatusEnum.DRAFT) throw new BadRequestException('Only DRAFT offers can be submitted');
    const result = simulate(offer.scenario as ScenarioType, offer.inputs as SimulatorInputs);
    if (result.warnings.length) {
      throw new BadRequestException({ message: 'Simulation incomplete', errors: result.warnings });
    }
    offer.outputs = result as unknown as Record<string, any>;
    return this.transition(ctx, offer, OfferStatusEnum.PENDING_CHECK, 'OFFER_SUBMITTED', (o) => { o.submittedAt = new Date(); });
  }

  async check(ctx: Ctx, id: number) {
    const offer = await this.get(ctx, id);
    if (offer.status !== OfferStatusEnum.PENDING_CHECK) throw new BadRequestException('Offer is not pending check');
    if (offer.makerPersonId === ctx.personId) throw new ForbiddenException('The maker cannot verify their own offer');
    return this.transition(ctx, offer, OfferStatusEnum.CHECKED, 'OFFER_CHECKED', (o) => {
      o.checkerPersonId = ctx.personId; o.checkedAt = new Date();
    });
  }

  async returnToDraft(ctx: Ctx, id: number, note?: string) {
    const offer = await this.get(ctx, id);
    if (![OfferStatusEnum.PENDING_CHECK, OfferStatusEnum.CHECKED].includes(offer.status)) {
      throw new BadRequestException('Only submitted or checked offers can be returned');
    }
    return this.transition(ctx, offer, OfferStatusEnum.DRAFT, 'OFFER_RETURNED', (o) => {
      o.submittedAt = null; o.checkerPersonId = null; o.checkedAt = null;
      o.resolutionNote = note ?? null;
    });
  }

  /** CRC Manager approval — auto-transitions to SENT (stub link email) and
   * starts the applicant's 5-working-day acceptance window. */
  async approve(ctx: Ctx, id: number) {
    const offer = await this.get(ctx, id);
    if (offer.status !== OfferStatusEnum.CHECKED) throw new BadRequestException('Only checked offers can be approved');
    if (offer.makerPersonId === ctx.personId) throw new ForbiddenException('The maker cannot approve their own offer');
    if (offer.checkerPersonId === ctx.personId) throw new ForbiddenException('The checker cannot also approve this offer');
    return this.dataSource.transaction(async (manager) => {
      offer.status = OfferStatusEnum.SENT;
      offer.approverPersonId = ctx.personId;
      offer.approvedAt = new Date();
      offer.sentAt = new Date();
      await manager.save(ProvisionalOffer, offer);
      await this.slaEvent(manager, KafkaTopicEnum.SLA_TIMER_CANCEL, CRA_OFFER_SLA_CODE, offer);
      await this.slaEvent(manager, KafkaTopicEnum.SLA_TIMER_START, OFFER_ACCEPTANCE_SLA_CODE, offer);
      // Stub acceptance link until Customer Portal pass 2 (design §3)
      await this.outboxEventRepository.record(manager, {
        id: uuid(), topic: KafkaTopicEnum.SEND_EMAIL,
        payload: {
          eventId: uuid(), emailSender: 'notification@sqf.ai',
          emailReceivers: [String((offer.inputs as any)?.applicantEmail ?? '')].filter(Boolean),
          emailCc: [], emailBcc: [], emailReplyTo: [],
          emailSubject: 'SQF — Your indicative letter of offer is ready',
          emailBody:
            `An indicative offer for ${offer.companyName ?? 'your company'} has been approved. ` +
            `Review and respond within 5 working days. (Acceptance link arrives with the client portal offer screen.)`,
        } as Record<string, unknown>,
      });
      await this.audit(manager, 'OFFER_APPROVED_SENT', offer, ctx, { from: OfferStatusEnum.CHECKED });
      return offer;
    });
  }

  async reject(ctx: Ctx, id: number, note?: string) {
    const offer = await this.get(ctx, id);
    if (offer.status !== OfferStatusEnum.CHECKED) throw new BadRequestException('Only checked offers can be rejected');
    return this.transition(ctx, offer, OfferStatusEnum.DRAFT, 'OFFER_REJECTED', (o) => {
      o.resolutionNote = note ?? null; o.checkerPersonId = null; o.checkedAt = null; o.submittedAt = null;
    });
  }

  /** RM resolution actions (risk_offers_resolve). `accepted`/`declined`
   * are dev stubs until the portal's acceptance ceremony (pass 2). */
  async resolve(ctx: Ctx, id: number, action: 'accept' | 'decline' | 'refresh' | 'close', note?: string) {
    const offer = await this.get(ctx, id);
    if (action === 'refresh') {
      if (offer.status !== OfferStatusEnum.LAPSED) throw new BadRequestException('Only lapsed offers can be refreshed');
      return this.dataSource.transaction(async (manager) => {
        offer.status = OfferStatusEnum.SENT;
        offer.sentAt = new Date();
        await manager.save(ProvisionalOffer, offer);
        await this.slaEvent(manager, KafkaTopicEnum.SLA_TIMER_START, OFFER_ACCEPTANCE_SLA_CODE, offer);
        await this.audit(manager, 'OFFER_REFRESHED', offer, ctx, null);
        return offer;
      });
    }
    if (action === 'close') {
      if (![OfferStatusEnum.DECLINED, OfferStatusEnum.LAPSED].includes(offer.status)) {
        throw new BadRequestException('Only declined or lapsed offers can be closed');
      }
      return this.transition(ctx, offer, OfferStatusEnum.CLOSED_ARCHIVED, 'OFFER_CLOSED', (o) => {
        o.resolvedAt = new Date(); o.resolutionNote = note ?? null;
      });
    }
    if (offer.status !== OfferStatusEnum.SENT) throw new BadRequestException('Only sent offers can be accepted or declined');
    const to = action === 'accept' ? OfferStatusEnum.ACCEPTED : OfferStatusEnum.DECLINED;
    return this.dataSource.transaction(async (manager) => {
      offer.status = to; offer.resolvedAt = new Date(); offer.resolutionNote = note ?? null;
      await manager.save(ProvisionalOffer, offer);
      await this.slaEvent(manager, KafkaTopicEnum.SLA_TIMER_CANCEL, OFFER_ACCEPTANCE_SLA_CODE, offer);
      await this.audit(manager, to === OfferStatusEnum.ACCEPTED ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED', offer, ctx, null);
      return offer;
    });
  }

  /** Registration fee received (pass-2 stub for the future Finance flow):
   * ACCEPTED offer -> Applicant becomes a non-active Client via
   * CLIENT_ONBOARDED (trade-directory sets fullyOnboardedAt; CRM projects
   * the My Clients list). */
  async confirmRegistrationFee(ctx: Ctx, id: number) {
    const offer = await this.get(ctx, id);
    if (offer.status !== OfferStatusEnum.ACCEPTED) {
      throw new BadRequestException('The registration fee applies after the offer is accepted');
    }
    if (offer.registrationFeeConfirmedAt) {
      throw new BadRequestException('Registration fee already confirmed');
    }
    return this.dataSource.transaction(async (manager) => {
      offer.registrationFeeConfirmedAt = new Date();
      offer.registrationFeeConfirmedBy = ctx.personId;
      await manager.save(ProvisionalOffer, offer);
      await this.outboxEventRepository.record(manager, {
        id: uuid(), topic: KafkaTopicEnum.CLIENT_ONBOARDED,
        payload: {
          eventId: uuid(),
          organizationId: offer.organizationId,
          funderOrganizationId: offer.funderOrganizationId,
          applicationId: offer.applicationId,
          offerId: offer.id,
          companyName: offer.companyName,
          productCode: offer.productCode,
          // Accepted commercial terms (add-only, 2026-07-24): Operations
          // renders the facility-agreement pack from these.
          keyTerms: offer.inputs ?? {},
        } as Record<string, unknown>,
      });
      await this.audit(manager, 'REGISTRATION_FEE_CONFIRMED', offer, ctx, null);
      return { ok: true, clientStatus: 'NON_ACTIVE_CLIENT' };
    });
  }

  /** SLA_BREACHED consumer path: acceptance window lapsed. */
  async onAcceptanceBreach(offerId: number): Promise<void> {
    const offer = await this.offerRepository.findOne({ where: { id: offerId } });
    if (!offer || offer.status !== OfferStatusEnum.SENT) return;
    offer.status = OfferStatusEnum.LAPSED;
    await this.offerRepository.save(offer);
    this.logger.log(`Offer ${offer.id} lapsed — acceptance window breached (RM notified by the SLA engine)`);
  }

  private async transition(ctx: Ctx, offer: ProvisionalOffer, to: OfferStatusEnum, event: string, mutate: (o: ProvisionalOffer) => void) {
    const from = offer.status;
    return this.dataSource.transaction(async (manager) => {
      offer.status = to; mutate(offer);
      await manager.save(ProvisionalOffer, offer);
      await this.audit(manager, event, offer, ctx, { from, to });
      return offer;
    });
  }

  private async slaEvent(manager: import('typeorm').EntityManager, topic: KafkaTopicEnum, slaCode: string, offer: ProvisionalOffer) {
    await this.outboxEventRepository.record(manager, {
      id: uuid(), topic,
      payload: {
        eventId: uuid(), funderOrganizationId: offer.funderOrganizationId,
        slaCode, subjectType: 'OFFER', subjectId: String(offer.id),
      } as Record<string, unknown>,
    });
  }

  private async audit(manager: import('typeorm').EntityManager, event: string, offer: ProvisionalOffer, ctx: Ctx, payload: Record<string, any> | null) {
    await manager.save(RiskAuditLog, manager.create(RiskAuditLog, {
      event: event as never,
      riskProfileCode: `OFFER_${offer.id}`,
      actorPersonId: ctx.personId,
      payload: {
        offerId: offer.id, applicationId: offer.applicationId,
        funderOrganizationId: offer.funderOrganizationId, status: offer.status,
        ...(payload ?? {}),
      },
    }));
  }
}
