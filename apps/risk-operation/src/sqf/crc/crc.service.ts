import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';
import { RiskFactorScoreMethodEnum } from '@app/common/apps/risk-operation/enums/risk-factor-score-method.enum';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskFactor } from '../../models/risk-factor.entity';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';
import {
  RiskAssessment,
  RiskAssessmentAnswer,
} from '../../models/risk-assessment.entity';
import { RiskAuditLog } from '../../models/risk-governance.entity';
import {
  AssessmentAnswers,
  computeAssessment,
  ModelStructure,
  validateModelStructure,
} from './scoring-engine';

export interface CallerContext {
  personId: number;
  orgId: number;
}

/** Audit events for the Filter-2 model lifecycle (append-only trail). */
export enum CrcAuditEvent {
  MODEL_CREATED = 'MODEL_CREATED',
  MODEL_UPDATED = 'MODEL_UPDATED',
  MODEL_SUBMITTED = 'MODEL_SUBMITTED',
  MODEL_CHECKED = 'MODEL_CHECKED',
  MODEL_RETURNED = 'MODEL_RETURNED',
  MODEL_REJECTED = 'MODEL_REJECTED',
  MODEL_PUBLISHED = 'MODEL_PUBLISHED',
  MODEL_ARCHIVED = 'MODEL_ARCHIVED',
  ASSESSMENT_CONDUCTED = 'ASSESSMENT_CONDUCTED',
}

interface SaveModelPayload {
  riskModelName?: string;
  description?: string;
  modelShape?: string;
  thresholds?: { low: [number, number]; medium: [number, number]; high: [number, number] };
  factors?: any[];
  overrides?: any[];
}

/**
 * Filter-2 risk model authoring + assessment (CRC pass 1, 2026-07-24).
 * Adopts the legacy risk_model/risk_factor tables (per-domain swap) and is
 * the ONLY write path — the unguarded 2024 CRUD modules are unregistered.
 *
 * Maker-checker: maker (risk_models_edit) can never check their own model;
 * neither maker nor checker can publish it (risk_models_publish). Enforced
 * here code-side, same pattern as RiskGovernanceService.
 */
@Injectable()
export class CrcService {
  constructor(
    @InjectRepository(RiskModel)
    private readonly riskModelRepository: Repository<RiskModel>,
    @InjectRepository(RiskFactor)
    private readonly riskFactorRepository: Repository<RiskFactor>,
    @InjectRepository(RiskHighClassificationFactor)
    private readonly overrideRepository: Repository<RiskHighClassificationFactor>,
    @InjectRepository(RiskAssessment)
    private readonly assessmentRepository: Repository<RiskAssessment>,
    private readonly dataSource: DataSource,
  ) {}

  // ------------------------------------------------------------------
  // Models
  // ------------------------------------------------------------------

  async listModels(ctx: CallerContext, status?: string) {
    const qb = this.riskModelRepository
      .createQueryBuilder('m')
      .orderBy('m.id', 'DESC');
    if (ctx.orgId !== 0) {
      qb.where('m."funderOrganizationId" = :orgId', { orgId: ctx.orgId });
    }
    if (status) {
      qb.andWhere('m."riskModelStatus" = :status', { status });
    }
    const models = await qb.getMany();
    return models.map((m) => this.toListRow(m));
  }

  async getModel(ctx: CallerContext, id: number) {
    const model = await this.getOwnModel(ctx, id);
    const structure = await this.loadStructure(model);
    return { ...this.toListRow(model), ...structure };
  }

  async createModel(ctx: CallerContext, payload: SaveModelPayload & { duplicateFromId?: number }) {
    this.requireRealOrg(ctx);
    if (!payload.riskModelName?.trim()) {
      throw new BadRequestException('riskModelName is required');
    }

    let seed: SaveModelPayload = payload;
    if (payload.duplicateFromId) {
      const source = await this.getOwnModel(ctx, payload.duplicateFromId);
      const sourceStructure = await this.loadStructure(source);
      seed = {
        ...sourceStructure,
        riskModelName: payload.riskModelName,
        description: payload.description ?? source.description,
        modelShape: payload.modelShape ?? source.modelShape,
      };
    }

    const thresholds = seed.thresholds ?? {
      low: [0, 20] as [number, number],
      medium: [21, 50] as [number, number],
      high: [51, 100] as [number, number],
    };

    return this.dataSource.transaction(async (manager) => {
      const model = manager.create(RiskModel, {
        riskModelNumber: await this.generateModelNumber(),
        riskModelName: payload.riskModelName!.trim(),
        description: seed.description,
        modelShape: seed.modelShape ?? 'MULTI_FACTOR',
        riskModelStatus: RiskModelStatusEnum.DRAFT,
        funderOrganizationId: ctx.orgId,
        createdByPersonId: ctx.personId,
        lowRiskThresholds: thresholds.low,
        mediumRiskThresholds: thresholds.medium,
        highRiskThresholds: thresholds.high,
      });
      let saved: RiskModel;
      try {
        saved = await manager.save(RiskModel, model);
      } catch (e: any) {
        if (e?.code === '23505') {
          throw new BadRequestException('A model with this name already exists for your organization');
        }
        throw e;
      }
      await this.replaceStructureRows(manager, saved, seed);
      await this.audit(manager, CrcAuditEvent.MODEL_CREATED, saved, ctx, {
        duplicateFromId: payload.duplicateFromId ?? null,
      });
      return { id: saved.id, riskModelNumber: saved.riskModelNumber };
    });
  }

  async updateModel(ctx: CallerContext, id: number, payload: SaveModelPayload) {
    const model = await this.getOwnModel(ctx, id);
    if (model.riskModelStatus !== RiskModelStatusEnum.DRAFT) {
      throw new BadRequestException('Only DRAFT models can be edited — duplicate a published model to modify it');
    }
    return this.dataSource.transaction(async (manager) => {
      if (payload.riskModelName?.trim()) model.riskModelName = payload.riskModelName.trim();
      if (payload.description !== undefined) model.description = payload.description;
      if (payload.modelShape) model.modelShape = payload.modelShape;
      if (payload.thresholds) {
        model.lowRiskThresholds = payload.thresholds.low;
        model.mediumRiskThresholds = payload.thresholds.medium;
        model.highRiskThresholds = payload.thresholds.high;
      }
      try {
        await manager.save(RiskModel, model);
      } catch (e: any) {
        if (e?.code === '23505') {
          throw new BadRequestException('A model with this name already exists for your organization');
        }
        throw e;
      }
      if (payload.factors !== undefined || payload.overrides !== undefined) {
        const current = await this.loadStructure(model);
        await this.replaceStructureRows(manager, model, {
          factors: payload.factors ?? current.factors,
          overrides: payload.overrides ?? current.overrides,
        });
      }
      await this.audit(manager, CrcAuditEvent.MODEL_UPDATED, model, ctx, null);
      return { ok: true };
    });
  }

  async submit(ctx: CallerContext, id: number) {
    const model = await this.getOwnModel(ctx, id);
    if (model.riskModelStatus !== RiskModelStatusEnum.DRAFT) {
      throw new BadRequestException('Only DRAFT models can be submitted for check');
    }
    const structure = await this.loadStructure(model);
    const errors = validateModelStructure(structure as ModelStructure);
    if (errors.length) {
      throw new BadRequestException({ message: 'Model validation failed', errors });
    }
    return this.transition(ctx, model, RiskModelStatusEnum.PENDING_CHECK, CrcAuditEvent.MODEL_SUBMITTED, (m) => {
      m.submittedAt = new Date();
    });
  }

  async checkModel(ctx: CallerContext, id: number) {
    const model = await this.getOwnModel(ctx, id);
    if (model.riskModelStatus !== RiskModelStatusEnum.PENDING_CHECK) {
      throw new BadRequestException('Only models pending check can be verified');
    }
    if (model.createdByPersonId === ctx.personId) {
      throw new ForbiddenException('The maker cannot verify their own model');
    }
    return this.transition(ctx, model, RiskModelStatusEnum.CHECKED, CrcAuditEvent.MODEL_CHECKED, (m) => {
      m.checkedByPersonId = ctx.personId;
      m.checkedAt = new Date();
    });
  }

  async returnModel(ctx: CallerContext, id: number, note: string | undefined, asRejection: boolean) {
    const model = await this.getOwnModel(ctx, id);
    const allowed: RiskModelStatusEnum[] = [RiskModelStatusEnum.PENDING_CHECK, RiskModelStatusEnum.CHECKED];
    if (!allowed.includes(model.riskModelStatus)) {
      throw new BadRequestException('Only models pending check or checked can be returned to draft');
    }
    return this.transition(
      ctx,
      model,
      RiskModelStatusEnum.DRAFT,
      asRejection ? CrcAuditEvent.MODEL_REJECTED : CrcAuditEvent.MODEL_RETURNED,
      (m) => {
        m.submittedAt = undefined as any;
        m.checkedByPersonId = undefined as any;
        m.checkedAt = undefined as any;
      },
      { note: note ?? null },
    );
  }

  async publish(ctx: CallerContext, id: number) {
    const model = await this.getOwnModel(ctx, id);
    if (model.riskModelStatus !== RiskModelStatusEnum.CHECKED) {
      throw new BadRequestException('Only checked models can be published');
    }
    if (model.createdByPersonId === ctx.personId) {
      throw new ForbiddenException('The maker cannot publish their own model');
    }
    if (model.checkedByPersonId === ctx.personId) {
      throw new ForbiddenException('The checker cannot also publish this model');
    }
    return this.transition(ctx, model, RiskModelStatusEnum.PUBLISHED, CrcAuditEvent.MODEL_PUBLISHED, (m) => {
      m.publishedByPersonId = ctx.personId;
      m.publishedAt = new Date();
    });
  }

  async archive(ctx: CallerContext, id: number) {
    const model = await this.getOwnModel(ctx, id);
    if (model.riskModelStatus !== RiskModelStatusEnum.PUBLISHED) {
      throw new BadRequestException('Only published models can be archived');
    }
    return this.transition(ctx, model, RiskModelStatusEnum.ARCHIVED, CrcAuditEvent.MODEL_ARCHIVED, () => undefined);
  }

  // ------------------------------------------------------------------
  // Assessments
  // ------------------------------------------------------------------

  async conductAssessment(
    ctx: CallerContext,
    payload: {
      riskModelId: number;
      organizationId: number;
      organizationName?: string;
      answers: AssessmentAnswers;
    },
  ) {
    this.requireRealOrg(ctx);
    const model = await this.getOwnModel(ctx, payload.riskModelId);
    if (model.riskModelStatus !== RiskModelStatusEnum.PUBLISHED) {
      throw new BadRequestException('Assessments can only be run against PUBLISHED models');
    }
    const structure = (await this.loadStructure(model)) as ModelStructure;
    let result;
    try {
      result = computeAssessment(structure, payload.answers ?? { nodes: {}, overrides: {} });
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    return this.dataSource.transaction(async (manager) => {
      const assessment = manager.create(RiskAssessment, {
        funderOrganizationId: ctx.orgId,
        organizationId: payload.organizationId,
        organizationName: payload.organizationName ?? null,
        riskModelId: model.id,
        riskModelNumber: model.riskModelNumber,
        riskModelName: model.riskModelName,
        modelSnapshot: structure as any,
        totalScore: String(result.totalScore),
        classification: result.classification,
        overrideTripped: result.overrideTripped,
        overrideFactors: result.overrideFactors.length ? result.overrideFactors : null,
        breakdown: result.breakdown as any,
        conductedByPersonId: ctx.personId,
      });
      const saved = await manager.save(RiskAssessment, assessment);
      for (const row of result.answerRows) {
        await manager.save(
          RiskAssessmentAnswer,
          manager.create(RiskAssessmentAnswer, {
            riskAssessmentId: saved.id,
            nodeKey: row.nodeKey,
            nodeName: row.nodeName,
            rawValue: row.rawValue,
            points: String(row.points),
            normalized: String(row.normalized),
            weightedContribution: String(row.weightedContribution),
          }),
        );
      }
      await this.audit(manager, CrcAuditEvent.ASSESSMENT_CONDUCTED, model, ctx, {
        assessmentId: saved.id,
        organizationId: payload.organizationId,
        totalScore: result.totalScore,
        classification: result.classification,
        overrideTripped: result.overrideTripped,
      });
      return {
        id: saved.id,
        totalScore: result.totalScore,
        classification: result.classification,
        overrideTripped: result.overrideTripped,
        overrideFactors: result.overrideFactors,
        breakdown: result.breakdown,
      };
    });
  }

  async listAssessments(ctx: CallerContext, organizationId?: number) {
    const qb = this.assessmentRepository
      .createQueryBuilder('a')
      .orderBy('a.id', 'DESC')
      .take(200);
    if (ctx.orgId !== 0) {
      qb.where('a.funder_organization_id = :orgId', { orgId: ctx.orgId });
    }
    if (organizationId) {
      qb.andWhere('a.organization_id = :organizationId', { organizationId });
    }
    const rows = await qb.getMany();
    return rows.map((a) => ({
      id: a.id,
      organizationId: a.organizationId,
      organizationName: a.organizationName,
      riskModelId: a.riskModelId,
      riskModelNumber: a.riskModelNumber,
      riskModelName: a.riskModelName,
      totalScore: Number(a.totalScore),
      classification: a.classification,
      overrideTripped: a.overrideTripped,
      conductedByPersonId: a.conductedByPersonId,
      createdAt: a.createdAt,
    }));
  }

  async getAssessment(ctx: CallerContext, id: number) {
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid id');
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['answers'],
    });
    if (!assessment || (ctx.orgId !== 0 && assessment.funderOrganizationId !== ctx.orgId)) {
      throw new NotFoundException('Assessment not found');
    }
    return {
      ...assessment,
      totalScore: Number(assessment.totalScore),
      answers: assessment.answers.map((row) => ({
        nodeKey: row.nodeKey,
        nodeName: row.nodeName,
        rawValue: row.rawValue,
        points: row.points === null ? null : Number(row.points),
        normalized: row.normalized === null ? null : Number(row.normalized),
        weightedContribution:
          row.weightedContribution === null ? null : Number(row.weightedContribution),
      })),
    };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private requireRealOrg(ctx: CallerContext) {
    if (ctx.orgId === 0) {
      throw new BadRequestException('SQFSYS cannot author funder-scoped records');
    }
  }

  private async getOwnModel(ctx: CallerContext, id: number): Promise<RiskModel> {
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid id');
    const model = await this.riskModelRepository.findOne({ where: { id } });
    if (!model || (ctx.orgId !== 0 && model.funderOrganizationId !== ctx.orgId)) {
      throw new NotFoundException('Risk model not found');
    }
    return model;
  }

  private toListRow(m: RiskModel) {
    return {
      id: m.id,
      riskModelNumber: m.riskModelNumber,
      riskModelName: m.riskModelName,
      description: m.description ?? null,
      modelShape: m.modelShape,
      status: m.riskModelStatus,
      funderOrganizationId: m.funderOrganizationId,
      createdByPersonId: m.createdByPersonId ?? null,
      checkedByPersonId: m.checkedByPersonId ?? null,
      publishedByPersonId: m.publishedByPersonId ?? null,
      submittedAt: m.submittedAt ?? null,
      checkedAt: m.checkedAt ?? null,
      publishedAt: m.publishedAt ?? null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      thresholds: {
        low: m.lowRiskThresholds,
        medium: m.mediumRiskThresholds,
        high: m.highRiskThresholds,
      },
    };
  }

  /** Rebuild the nested structure from the flat risk_factor rows. */
  private async loadStructure(model: RiskModel) {
    const rows = await this.riskFactorRepository.find({
      where: { riskModelId: model.id },
      order: { id: 'ASC' },
    });
    const overrides = await this.overrideRepository.find({
      where: { riskModelId: model.id },
      order: { id: 'ASC' },
    });

    const factors = rows
      .filter((r) => r.parentId === null)
      .map((f) => {
        const base: any = {
          name: f.riskFactorName,
          description: f.description ?? undefined,
          weight: f.weight === null ? 0 : Number(f.weight),
        };
        if (model.modelShape === 'SIMPLE_WEIGHTED') {
          base.scoring = f.scoringConfig ?? undefined;
        } else {
          base.categories = rows
            .filter((c) => c.parentId === f.id && c.isSetAsCategory === 1)
            .map((c) => ({
              name: c.riskFactorName,
              description: c.description ?? undefined,
              weight: c.weight === null ? 0 : Number(c.weight),
              subFactors: rows
                .filter((s) => s.parentId === c.id)
                .map((s) => ({
                  name: s.riskFactorName,
                  description: s.description ?? undefined,
                  weight: s.weight === null ? 0 : Number(s.weight),
                  scoring: s.scoringConfig ?? undefined,
                })),
            }));
        }
        return base;
      });

    return {
      modelShape: model.modelShape as ModelStructure['modelShape'],
      thresholds: {
        low: model.lowRiskThresholds,
        medium: model.mediumRiskThresholds,
        high: model.highRiskThresholds,
      },
      factors,
      overrides: overrides.map((o) => ({
        name: o.riskFactor,
        description: o.description ?? undefined,
      })),
    };
  }

  /**
   * Whole-set replace of the structure rows (builder saves the full
   * document; only DRAFT models reach here). Light shape checks only —
   * full validation runs at submit-for-check.
   */
  private async replaceStructureRows(
    manager: import('typeorm').EntityManager,
    model: RiskModel,
    payload: SaveModelPayload,
  ) {
    await manager.delete(RiskFactor, { riskModelId: model.id });
    await manager.delete(RiskHighClassificationFactor, { riskModelId: model.id });

    const factors = Array.isArray(payload.factors) ? payload.factors : [];
    for (const f of factors) {
      if (!f?.name || typeof f.name !== 'string') {
        throw new BadRequestException('Every factor needs a name');
      }
      const factorRow = await manager.save(
        RiskFactor,
        manager.create(RiskFactor, {
          riskModelId: model.id,
          riskFactorName: f.name,
          description: f.description ?? null,
          weight: f.weight ?? 0,
          tabName: model.modelShape === 'MULTI_FACTOR' ? f.name : null,
          isSetAsCategory: 0,
          parentId: null,
          scoreMethod: this.methodOf(f.scoring),
          scoringConfig: model.modelShape === 'SIMPLE_WEIGHTED' ? f.scoring ?? null : null,
        } as any),
      );
      for (const c of f.categories ?? []) {
        if (!c?.name || typeof c.name !== 'string') {
          throw new BadRequestException('Every category needs a name');
        }
        const categoryRow = await manager.save(
          RiskFactor,
          manager.create(RiskFactor, {
            riskModelId: model.id,
            riskFactorName: c.name,
            description: c.description ?? null,
            weight: c.weight ?? 0,
            isSetAsCategory: 1,
            parentId: factorRow.id,
          } as any),
        );
        for (const s of c.subFactors ?? []) {
          if (!s?.name || typeof s.name !== 'string') {
            throw new BadRequestException('Every sub-factor needs a name');
          }
          await manager.save(
            RiskFactor,
            manager.create(RiskFactor, {
              riskModelId: model.id,
              riskFactorName: s.name,
              description: s.description ?? null,
              weight: s.weight ?? 0,
              isSetAsCategory: 0,
              parentId: categoryRow.id,
              scoreMethod: this.methodOf(s.scoring),
              scoringConfig: s.scoring ?? null,
            } as any),
          );
        }
      }
    }

    for (const o of payload.overrides ?? []) {
      if (!o?.name || typeof o.name !== 'string') {
        throw new BadRequestException('Every override needs a name');
      }
      await manager.save(
        RiskHighClassificationFactor,
        manager.create(RiskHighClassificationFactor, {
          riskModelId: model.id,
          riskFactor: o.name,
          description: o.description ?? null,
        } as any),
      );
    }
  }

  private methodOf(scoring: any): RiskFactorScoreMethodEnum | null {
    const method = scoring?.method;
    return method && Object.values(RiskFactorScoreMethodEnum).includes(method)
      ? (method as RiskFactorScoreMethodEnum)
      : null;
  }

  private async transition(
    ctx: CallerContext,
    model: RiskModel,
    to: RiskModelStatusEnum,
    event: CrcAuditEvent,
    mutate: (m: RiskModel) => void,
    extraPayload: Record<string, any> | null = null,
  ) {
    const from = model.riskModelStatus;
    return this.dataSource.transaction(async (manager) => {
      model.riskModelStatus = to;
      mutate(model);
      await manager.save(RiskModel, model);
      await this.audit(manager, event, model, ctx, { from, to, ...(extraPayload ?? {}) });
      return { ok: true, status: to };
    });
  }

  private async audit(
    manager: import('typeorm').EntityManager,
    event: CrcAuditEvent | string,
    model: RiskModel,
    ctx: CallerContext,
    payload: Record<string, any> | null,
  ) {
    await manager.save(
      RiskAuditLog,
      manager.create(RiskAuditLog, {
        event: event as any,
        riskProfileCode: model.riskModelNumber,
        actorPersonId: ctx.personId,
        payload: {
          riskModelId: model.id,
          riskModelName: model.riskModelName,
          funderOrganizationId: model.funderOrganizationId,
          ...(payload ?? {}),
        },
      }),
    );
  }

  private async generateModelNumber(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = `RM_${Array.from({ length: 6 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32)),
      ).join('')}`;
      const existing = await this.riskModelRepository.findOne({
        where: { riskModelNumber: code },
      });
      if (!existing) return code;
    }
    throw new Error('Could not generate a unique model number');
  }
}
