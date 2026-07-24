import { createHash } from 'crypto';
import {
  BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { LendingProductEnum } from '@app/common/apps/trade-directory/enums/lending-product.enum';
import { ContractTypeEnum } from '@app/common/apps/trade-directory/enums/contract-type.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Contract } from '../models/contract.entity';
import { OperationsCase, OperationsCaseStatusEnum as S } from '../models/operations-case.entity';
import { Organization } from '../models/organization.entity';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';

export const AGREEMENT_SLA_CODE = 'CLIENT_AGREEMENT_SIGNATURE';

const LENDING_PRODUCT: Record<string, LendingProductEnum> = {
  AR: LendingProductEnum.AR_FINANCE,
  SCF: LendingProductEnum.SUPPLY_CHAIN_FINANCE,
  IF: LendingProductEnum.INVOICE_FACTORING,
  TL: LendingProductEnum.TERM_LOAN,
};

interface Ctx { personId: number; orgId: number }

/**
 * Operations Hub pass 1 — Product Approval (blueprint §1): operator maker
 * -> second operator check -> Operations Manager approve -> client passkey
 * signature -> FACILITY_AGREEMENT contract executed. Agreement text is a
 * deterministic render of the accepted offer terms (configurator
 * Handlebars template-pack integration is a recorded follow-up); the
 * signature evidence (sha256/credential/IP/time) lives immutably on the
 * case and the pack hash is what the client's passkey signs.
 */
@Injectable()
export class OperationsService {
  private readonly logger = new Logger(OperationsService.name);

  constructor(
    @InjectRepository(OperationsCase) private readonly caseRepository: Repository<OperationsCase>,
    @InjectRepository(Organization) private readonly organizationRepository: Repository<Organization>,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly jwtService: JwtService,
    private readonly entityManager: EntityManager,
  ) {}

  /** Called by the CLIENT_ONBOARDED consumer — queue the case. */
  async createCaseFromOnboarding(event: any): Promise<void> {
    const existing = await this.caseRepository.findOne({
      where: {
        organizationId: event.organizationId,
        status: In([S.NEW, S.IN_PREPARATION, S.PENDING_CHECK, S.CHECKED, S.PENDING_SIGNATURE]),
      },
    });
    if (existing) return;
    await this.caseRepository.save(this.caseRepository.create({
      funderOrganizationId: event.funderOrganizationId,
      organizationId: event.organizationId,
      companyName: event.companyName ?? null,
      applicationId: event.applicationId ?? null,
      offerId: event.offerId ?? null,
      productCode: event.productCode ?? 'IF',
      agreementTerms: event.keyTerms ?? {},
      status: S.NEW,
    }));
    this.logger.log(`Operations case queued for ${event.companyName ?? event.organizationId}`);
  }

  async list(ctx: Ctx) {
    const qb = this.caseRepository.createQueryBuilder('c').orderBy('c.updatedAt', 'DESC').take(200);
    if (ctx.orgId !== 0) qb.where('c."funderOrganizationId" = :orgId', { orgId: ctx.orgId });
    return qb.getMany();
  }

  async get(ctx: Ctx, id: number) {
    const row = await this.caseRepository.findOne({ where: { id } });
    if (!row || (ctx.orgId !== 0 && row.funderOrganizationId !== ctx.orgId)) {
      throw new NotFoundException('Case not found');
    }
    return row;
  }

  /** Deterministic facility-agreement render — the pack the client signs. */
  private renderAgreement(row: OperationsCase): { text: string; sha256: string } {
    const terms = row.agreementTerms ?? {};
    const lines = Object.entries(terms)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `  - ${k}: ${v}`)
      .sort();
    const text = [
      'FACILITY AGREEMENT (INDICATIVE PACK)',
      `Funder organization: ${row.funderOrganizationId}`,
      `Client: ${row.companyName ?? row.organizationId} (organization ${row.organizationId})`,
      `Product: ${row.productCode}`,
      `Operations case: ${row.id}`,
      'Commercial terms (as accepted in the Indicative Letter of Offer):',
      ...lines,
      'This facility is subject to the executed agreement, the funder\'s standard terms,',
      'and continuing compliance monitoring. Electronic signature via passkey re-authentication',
      'carries the same legal weight as a physical signature (Electronic Commerce Act 2006, MY).',
    ].join('\n');
    return { text, sha256: createHash('sha256').update(text).digest('hex') };
  }

  async pickup(ctx: Ctx, id: number) {
    const row = await this.get(ctx, id);
    if (row.status !== S.NEW) throw new BadRequestException('Case already picked up');
    const { text, sha256 } = this.renderAgreement(row);
    row.status = S.IN_PREPARATION;
    row.operatorPersonId = ctx.personId;
    row.agreementText = text;
    row.agreementSha256 = sha256;
    await this.caseRepository.save(row);
    return row;
  }

  async submit(ctx: Ctx, id: number) {
    const row = await this.get(ctx, id);
    if (row.status !== S.IN_PREPARATION) throw new BadRequestException('Only cases in preparation can be submitted');
    if (row.operatorPersonId !== ctx.personId) throw new ForbiddenException('Only the assigned operator can submit this case');
    if (!row.agreementSha256) throw new BadRequestException('Agreement pack missing');
    row.status = S.PENDING_CHECK;
    await this.caseRepository.save(row);
    return row;
  }

  async check(ctx: Ctx, id: number) {
    const row = await this.get(ctx, id);
    if (row.status !== S.PENDING_CHECK) throw new BadRequestException('Case is not pending check');
    if (row.operatorPersonId === ctx.personId) throw new ForbiddenException('The preparing operator cannot verify their own pack');
    row.status = S.CHECKED;
    row.checkerPersonId = ctx.personId;
    await this.caseRepository.save(row);
    return row;
  }

  async returnToPreparation(ctx: Ctx, id: number, note?: string) {
    const row = await this.get(ctx, id);
    if (![S.PENDING_CHECK, S.CHECKED].includes(row.status)) {
      throw new BadRequestException('Only submitted or checked cases can be returned');
    }
    row.status = S.IN_PREPARATION;
    row.checkerPersonId = null;
    row.resolutionNote = note ?? null;
    await this.caseRepository.save(row);
    return row;
  }

  /** OM approval — the pack goes to the client signatory + signature SLA. */
  async approve(ctx: Ctx, id: number) {
    const row = await this.get(ctx, id);
    if (row.status !== S.CHECKED) throw new BadRequestException('Only checked cases can be approved');
    if (row.operatorPersonId === ctx.personId) throw new ForbiddenException('The preparing operator cannot approve their own pack');
    if (row.checkerPersonId === ctx.personId) throw new ForbiddenException('The checker cannot also approve this pack');
    return this.entityManager.transaction(async (manager) => {
      row.status = S.PENDING_SIGNATURE;
      row.approverPersonId = ctx.personId;
      await manager.save(OperationsCase, row);
      await this.outboxEventRepository.record(manager, {
        id: uuid(), topic: KafkaTopicEnum.SLA_TIMER_START,
        payload: {
          eventId: uuid(), funderOrganizationId: row.funderOrganizationId,
          slaCode: AGREEMENT_SLA_CODE, subjectType: 'OPERATIONS_CASE', subjectId: String(row.id),
        } as Record<string, unknown>,
      });
      await this.outboxEventRepository.record(manager, {
        id: uuid(), topic: KafkaTopicEnum.SEND_EMAIL,
        payload: {
          eventId: uuid(), emailSender: 'notification@sqf.ai',
          emailReceivers: [String((row.agreementTerms as any)?.applicantEmail ?? '')].filter(Boolean),
          emailCc: [], emailBcc: [], emailReplyTo: [],
          emailSubject: 'SQF — Your facility agreement is ready to sign',
          emailBody:
            `The facility agreement for ${row.companyName ?? 'your company'} is ready. ` +
            `Sign in to the client portal and execute it with your passkey.`,
        } as Record<string, unknown>,
      });
      return row;
    });
  }

  // ------------------ Client (portal) side ------------------

  async portalView(orgId: number) {
    const row = await this.caseRepository.findOne({
      where: { organizationId: orgId, status: In([S.PENDING_SIGNATURE, S.EXECUTED]) },
      order: { id: 'DESC' },
    });
    if (!row) throw new NotFoundException('No agreement awaiting signature');
    return {
      status: row.status,
      productCode: row.productCode,
      companyName: row.companyName,
      agreementText: row.agreementText,
      agreementSha256: row.agreementSha256,
      signedAt: row.signedAt,
      contractId: row.contractId,
    };
  }

  /** Client signatory signs the pack: esign JWT bound to the pack hash ->
   * EXECUTED -> FACILITY_AGREEMENT contract (facility in force = active). */
  async portalSign(orgId: number, personId: number, esignToken: string, ip: string | null) {
    const row = await this.caseRepository.findOne({
      where: { organizationId: orgId, status: S.PENDING_SIGNATURE },
      order: { id: 'DESC' },
    });
    if (!row) throw new NotFoundException('No agreement awaiting signature');

    let claims: any;
    try {
      claims = await this.jwtService.verifyAsync(esignToken);
    } catch {
      throw new UnauthorizedException('E-signature expired or invalid — sign again');
    }
    if (claims.purpose !== 'esign' || claims.personId !== personId || claims.docSha256 !== row.agreementSha256) {
      throw new UnauthorizedException('E-signature does not match this agreement or signer');
    }

    const funder = await this.organizationRepository.findOne({ where: { id: row.funderOrganizationId } });
    const funderPersonaId = (funder as any)?.funderPersonaId;
    if (!funderPersonaId) throw new BadRequestException('Funder organization has no funder persona');
    const lendingProduct = LENDING_PRODUCT[row.productCode] ?? LendingProductEnum.INVOICE_FACTORING;

    return this.entityManager.transaction(async (manager) => {
      const contract = await manager.save(Contract, new Contract({
        funderPersonaId,
        contractType: ContractTypeEnum.FACILITY_AGREEMENT,
        firstPartyOrganizationId: row.funderOrganizationId,
        secondPartyOrganizationId: row.organizationId,
        lendingProduct,
        reference: `FA-OPS-${row.id}`,
        startDate: new Date().toISOString().slice(0, 10),
      } as Partial<Contract>));
      await this.outboxEventRepository.record(manager, {
        id: uuid(), topic: KafkaTopicEnum.CONTRACT_UPSERTED,
        payload: { eventId: uuid(), ...contract } as Record<string, unknown>,
      });
      row.status = S.EXECUTED;
      row.signedByPersonId = personId;
      row.signedCredentialId = String(claims.credentialId ?? '');
      row.signedAt = new Date();
      row.signatureIp = ip;
      row.contractId = contract.id;
      await manager.save(OperationsCase, row);
      await this.outboxEventRepository.record(manager, {
        id: uuid(), topic: KafkaTopicEnum.SLA_TIMER_CANCEL,
        payload: {
          eventId: uuid(), funderOrganizationId: row.funderOrganizationId,
          slaCode: AGREEMENT_SLA_CODE, subjectType: 'OPERATIONS_CASE', subjectId: String(row.id),
        } as Record<string, unknown>,
      });
      this.logger.log(`Facility executed: case ${row.id} -> contract ${contract.id} (${row.companyName})`);
      return { status: row.status, contractId: contract.id, signedAt: row.signedAt };
    });
  }
}
