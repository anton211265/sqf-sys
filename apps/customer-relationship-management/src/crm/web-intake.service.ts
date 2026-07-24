import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantIntake } from '../models/applicant-intake.entity';

interface ApplicationScoredEvent {
  eventId: string;
  applicationId: number;
  applicationNumber: string;
  funderOrganizationId: number;
  organizationId: number;
  companyName: string | null;
  productCode: string | null;
  filter1Score: number | null;
  filter1Category: string | null;
  result: 'PASS' | 'FAIL';
  overridden: boolean;
  submittedAt: string | null;
}

/**
 * Customer Portal pass 1: the RM Supervisor "new applicants (web)" queue —
 * a projection of APPLICATION_SCORED events (risk-operation owns the
 * lifecycle; assignment is the CRM-owned column here).
 */
@Injectable()
export class WebIntakeService {
  constructor(
    @InjectRepository(ApplicantIntake)
    private readonly applicantIntakeRepository: Repository<ApplicantIntake>,
  ) {}

  async upsertFromEvent(event: ApplicationScoredEvent): Promise<void> {
    const existing = await this.applicantIntakeRepository.findOne({
      where: { applicationId: event.applicationId },
    });
    const row = existing ?? this.applicantIntakeRepository.create({
      applicationId: event.applicationId,
    });
    row.funderOrganizationId = event.funderOrganizationId;
    row.applicationNumber = event.applicationNumber;
    row.organizationId = event.organizationId;
    row.companyName = event.companyName ?? null;
    row.productCode = event.productCode ?? null;
    row.filter1Score = event.filter1Score === null ? null : String(event.filter1Score);
    row.filter1Category = event.filter1Category ?? null;
    row.result = event.result;
    row.overridden = event.overridden === true;
    row.submittedAt = event.submittedAt ? new Date(event.submittedAt) : null;
    await this.applicantIntakeRepository.save(row);
  }

  async list(funderOrganizationId: number) {
    const qb = this.applicantIntakeRepository
      .createQueryBuilder('a')
      .orderBy('a.submittedAt', 'ASC')
      .take(200);
    if (funderOrganizationId !== 0) {
      qb.where('a."funderOrganizationId" = :funderOrganizationId', { funderOrganizationId });
    }
    const rows = await qb.getMany();
    return rows.map((a) => ({
      ...a,
      filter1Score: a.filter1Score === null ? null : Number(a.filter1Score),
    }));
  }

  async markClientOnboarded(applicationId: number): Promise<void> {
    const row = await this.applicantIntakeRepository.findOne({ where: { applicationId } });
    if (row && !row.clientOnboardedAt) {
      row.clientOnboardedAt = new Date();
      await this.applicantIntakeRepository.save(row);
    }
  }

  async listClients(funderOrganizationId: number, rmPersonId: number, supervisor: boolean) {
    const qb = this.applicantIntakeRepository
      .createQueryBuilder('a')
      .where('a."clientOnboardedAt" IS NOT NULL')
      .orderBy('a."clientOnboardedAt"', 'DESC')
      .take(200);
    if (funderOrganizationId !== 0) {
      qb.andWhere('a."funderOrganizationId" = :funderOrganizationId', { funderOrganizationId });
    }
    if (!supervisor) {
      qb.andWhere('a."assignedRmPersonId" = :rmPersonId', { rmPersonId });
    }
    return qb.getMany();
  }

  async assign(funderOrganizationId: number, id: number, rmPersonId: number) {
    const row = await this.applicantIntakeRepository.findOne({ where: { id } });
    if (!row || (funderOrganizationId !== 0 && row.funderOrganizationId !== funderOrganizationId)) {
      throw new NotFoundException('Applicant not found');
    }
    row.assignedRmPersonId = rmPersonId;
    await this.applicantIntakeRepository.save(row);
    return { ok: true, assignedRmPersonId: rmPersonId };
  }
}
