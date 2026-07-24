import { createHash } from 'crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Ip,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { OfferAcceptance } from '../../models/offer-acceptance.entity';
import { OfferStatusEnum, ProvisionalOffer } from '../../models/provisional-offer.entity';
import { RiskAuditEvent, RiskAuditLog } from '../../models/risk-governance.entity';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { PortalJwtGuard } from '../portal-application/portal-jwt.guard';
import { OFFER_ACCEPTANCE_SLA_CODE } from './offers.service';

class RespondDto {
  @IsIn(['accept', 'decline']) decision: 'accept' | 'decline';
  /** Required for accept: the esign JWT from /auth/passkey/esign-verify. */
  @IsOptional() @IsString() esignToken?: string;
  @IsString() @Length(64, 64) termsSha256: string;
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

/** The exact terms the applicant sees and signs — hashed for the record. */
export function clientTermsView(offer: ProvisionalOffer) {
  const i = offer.inputs ?? {};
  const terms = {
    offerId: offer.id,
    productCode: offer.productCode,
    scenario: offer.scenario,
    keyTerms: {
      facilityLimit: i.facilityLimit ?? i.loanAmount ?? i.preFacilityLimit ?? null,
      unexpiredContractValue: i.unexpiredContractValue ?? null,
      advanceRate: i.advanceRate ?? i.scfAdvanceRate ?? null,
      profitRatePa: i.profitRatePa ?? i.scfDiscountRatePa ?? null,
      monthlyRateFlat: i.tlRateFlatMonthly ?? null,
      tenureMonths: i.tenureMonths ?? i.instalments ?? null,
      creditPeriodDays: i.creditPeriodDays ?? i.buyerTermsDays ?? null,
      adminFeeRate: i.adminFeeRate ?? null,
      processingFeeOnApplication: i.processingFeeOnApplication ?? null,
    },
  };
  const termsSha256 = createHash('sha256').update(JSON.stringify(terms)).digest('hex');
  return { terms, termsSha256 };
}

/**
 * Customer Portal pass 2 — the applicant's side of the provisional offer
 * (ILO): sanitized terms only (never internal exposure/profit outputs),
 * acceptance via the passkey e-signature ceremony, decline with reason,
 * and the post-acceptance registration-fee status.
 */
@Controller('api/portal/offer')
@UseGuards(PortalJwtGuard)
export class PortalOfferController {
  constructor(
    @InjectRepository(ProvisionalOffer) private readonly offerRepository: Repository<ProvisionalOffer>,
    @InjectRepository(OfferAcceptance) private readonly acceptanceRepository: Repository<OfferAcceptance>,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private async ownOffer(orgId: number): Promise<ProvisionalOffer> {
    const offer = await this.offerRepository.findOne({
      where: {
        organizationId: orgId,
        status: In([OfferStatusEnum.SENT, OfferStatusEnum.ACCEPTED, OfferStatusEnum.DECLINED, OfferStatusEnum.LAPSED]),
      },
      order: { id: 'DESC' },
    });
    if (!offer) throw new NotFoundException('No offer available');
    return offer;
  }

  @Get()
  async view(@Req() req: any) {
    const offer = await this.ownOffer(req.userContext.orgId);
    const { terms, termsSha256 } = clientTermsView(offer);
    return {
      status: offer.status,
      sentAt: offer.sentAt,
      resolvedAt: offer.resolvedAt,
      registrationFeeConfirmedAt: offer.registrationFeeConfirmedAt,
      companyName: offer.companyName,
      terms,
      termsSha256,
    };
  }

  @Post('respond')
  async respond(@Req() req: any, @Body() dto: RespondDto, @Ip() ip: string) {
    const orgId = req.userContext.orgId as number;
    const personId = req.userContext.id as number;
    const offer = await this.ownOffer(orgId);
    if (offer.status !== OfferStatusEnum.SENT) {
      throw new BadRequestException('This offer is no longer open for a response');
    }
    const { termsSha256 } = clientTermsView(offer);
    if (dto.termsSha256 !== termsSha256) {
      throw new BadRequestException('The offer terms have changed — reload and review again');
    }

    let credentialId = '';
    if (dto.decision === 'accept') {
      // The e-signature: a 5-minute JWT trade-directory minted only after a
      // fresh passkey assertion, bound to this exact terms hash.
      if (!dto.esignToken) throw new BadRequestException('Acceptance requires the passkey e-signature');
      let claims: any;
      try {
        claims = await this.jwtService.verifyAsync(dto.esignToken);
      } catch {
        throw new UnauthorizedException('E-signature expired or invalid — sign again');
      }
      if (claims.purpose !== 'esign' || claims.personId !== personId || claims.docSha256 !== termsSha256) {
        throw new UnauthorizedException('E-signature does not match this offer or signer');
      }
      credentialId = String(claims.credentialId ?? '');
    }

    const accepted = dto.decision === 'accept';
    return this.dataSource.transaction(async (manager) => {
      await manager.save(OfferAcceptance, manager.create(OfferAcceptance, {
        offerId: offer.id,
        applicationId: offer.applicationId,
        organizationId: orgId,
        personId,
        credentialId: credentialId || 'N/A-DECLINE',
        termsSha256,
        decision: accepted ? 'ACCEPTED' : 'DECLINED',
        declineReason: accepted ? null : dto.reason ?? null,
        ipAddress: ip ?? null,
        userAgent: req.headers?.['user-agent'] ?? null,
      }));
      offer.status = accepted ? OfferStatusEnum.ACCEPTED : OfferStatusEnum.DECLINED;
      offer.resolvedAt = new Date();
      if (!accepted) offer.resolutionNote = dto.reason ?? null;
      await manager.save(ProvisionalOffer, offer);
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.SLA_TIMER_CANCEL,
        payload: {
          eventId: uuid(), funderOrganizationId: offer.funderOrganizationId,
          slaCode: OFFER_ACCEPTANCE_SLA_CODE, subjectType: 'OFFER', subjectId: String(offer.id),
        } as Record<string, unknown>,
      });
      await manager.save(RiskAuditLog, manager.create(RiskAuditLog, {
        event: (accepted ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED') as RiskAuditEvent,
        riskProfileCode: `OFFER_${offer.id}`,
        actorPersonId: personId,
        payload: {
          offerId: offer.id, applicationId: offer.applicationId,
          funderOrganizationId: offer.funderOrganizationId,
          via: 'CUSTOMER_PORTAL', termsSha256, credentialId: credentialId || null,
        },
      }));
      return {
        status: offer.status,
        nextStep: accepted
          ? 'REGISTRATION_FEE'
          : null,
      };
    });
  }
}
