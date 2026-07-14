import { RelationshipTypeEnum } from '@app/common/apps/trade-directory/enums/relationship-type.enum';
import { CountryCodeEnum } from '@app/common/constants/countries';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { BuyerPersona } from '../models/buyer-persona.entity';
import { Organization } from '../models/organization.entity';
import { Relationship } from '../models/relationship.entity';
import { SupplierPersona } from '../models/supplier-persona.entity';
import { OutboxEventRepository } from '../repositories';
import { NewOrganizationDto } from './dto/new-organization.dto';

// Postgres unique_violation SQLSTATE.
const isUniqueViolation = (err: unknown): boolean =>
  typeof err === 'object' &&
  err !== null &&
  (err as { code?: string }).code === '23505';

// Ensures the supplier/buyer personas and the SUPPLIES_TO relationship
// implied by an invoice's issuer/debtor actually exist in the directory —
// so the trade network builds itself up as invoices flow through it,
// instead of requiring an RM to separately create them by hand.
//
// Scope: invoice creation only (2026-07-14 decision). Manual Relationship/
// Contract creation stays purely explicit — see CLAUDE.md.
//
// Every method takes the transactional `manager` so callers can run this
// inside their own `entityManager.transaction(...)` block. Do not add
// repository injections here for Organization/Relationship/personas — the
// injected repositories operate on a different (non-transactional)
// EntityManager and would break atomicity with the invoice write.
@Injectable()
export class InvoiceTradeNetworkService {
  constructor(private readonly outboxEventRepository: OutboxEventRepository) {}

  async ensureSupplierPersona(
    manager: EntityManager,
    organizationId: number,
  ): Promise<void> {
    const organization = await manager.findOne(Organization, {
      where: { id: organizationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (organization.supplierPersonaId) return;

    const persona = await manager.save(SupplierPersona, new SupplierPersona({}));
    // SupplierPersonaSubscriber.afterInsert sets the SU000001-style id.
    await manager.update(
      Organization,
      { id: organizationId },
      { supplierPersonaId: persona.id },
    );
  }

  async ensureBuyerPersona(
    manager: EntityManager,
    organizationId: number,
  ): Promise<void> {
    const organization = await manager.findOne(Organization, {
      where: { id: organizationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (organization.buyerPersonaId) return;

    const persona = await manager.save(BuyerPersona, new BuyerPersona({}));
    // BuyerPersonaSubscriber.afterInsert sets the BY000001-style id.
    await manager.update(
      Organization,
      { id: organizationId },
      { buyerPersonaId: persona.id },
    );
  }

  async ensureRelationship(
    manager: EntityManager,
    params: {
      funderPersonaId: number;
      issuerOrganizationId: number;
      debtorOrganizationId: number;
    },
  ): Promise<number> {
    const where = {
      fromOrganizationId: params.issuerOrganizationId,
      toOrganizationId: params.debtorOrganizationId,
      relationshipType: RelationshipTypeEnum.SUPPLIES_TO,
      funderPersonaId: params.funderPersonaId,
    };

    const existing = await manager.findOne(Relationship, { where });
    if (existing) return existing.id;

    try {
      const saved = await manager.save(
        Relationship,
        new Relationship({
          fromOrganizationId: params.issuerOrganizationId,
          toOrganizationId: params.debtorOrganizationId,
          relationshipType: RelationshipTypeEnum.SUPPLIES_TO,
          funderPersonaId: params.funderPersonaId,
        }),
      );
      await this.outboxEventRepository.record(manager, {
        id: uuid(),
        topic: KafkaTopicEnum.RELATIONSHIP_UPSERTED,
        payload: { eventId: uuid(), ...saved },
      });
      return saved.id;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      // A concurrent invoice won the (from, to, type) unique race — reuse it.
      const raced = await manager.findOneOrFail(Relationship, { where });
      return raced.id;
    }
  }

  // Resolves an existing org by id, or auto-creates a bare one from
  // newOrganization when no id was supplied. Dedup order: businessRegistrationNumber
  // (when given) is a much more reliable real-world key than organizationName,
  // which falls back to matching the one other org-creation path in this
  // codebase (the dormant SQF_CREATE_ORGANIZATION Kafka handler).
  //
  // Honesty note: neither organizationName nor businessRegistrationNumber has
  // a unique constraint on the live organization table (checked \d organization
  // — only the persona FK columns are UNIQUE). Unlike ensureRelationship's
  // catch-and-reread, there is no DB constraint here for a race to violate, so
  // this dedup is correct for the sequential case but not a concurrency
  // guarantee — two invoices auto-creating the same org at the exact same
  // moment could both succeed and insert two rows.
  private async resolveOrCreateOrganization(
    manager: EntityManager,
    params: {
      organizationId?: number;
      newOrganization?: NewOrganizationDto;
      source: 'invoice_issuer' | 'invoice_debtor';
      funderPersonaId: number;
    },
  ): Promise<Organization> {
    if (params.organizationId) {
      const organization = await manager.findOne(Organization, {
        where: { id: params.organizationId },
      });
      if (!organization) {
        throw new NotFoundException(
          `Organization ${params.organizationId} not found`,
        );
      }
      return organization;
    }

    const newOrg = params.newOrganization!;

    if (newOrg.businessRegistrationNumber) {
      const byRegNumber = await manager.findOne(Organization, {
        where: { businessRegistrationNumber: newOrg.businessRegistrationNumber },
      });
      if (byRegNumber) return byRegNumber;
    }
    const byName = await manager.findOne(Organization, {
      where: { organizationName: newOrg.organizationName },
    });
    if (byName) return byName;

    // country has no database-level default and is NOT NULL (confirmed live
    // via information_schema.columns) — fall back explicitly, not on the DB.
    const created = await manager.save(
      Organization,
      new Organization({
        organizationName: newOrg.organizationName,
        businessRegistrationNumber: newOrg.businessRegistrationNumber,
        country: newOrg.country ?? CountryCodeEnum.MY,
        organizationType: newOrg.organizationType,
      }),
    );
    await this.emitOrganizationCreated(
      manager,
      created,
      params.source,
      params.funderPersonaId,
    );
    return created;
  }

  async resolveOrganizations(
    manager: EntityManager,
    params: {
      issuerOrganizationId?: number;
      newIssuerOrganization?: NewOrganizationDto;
      debtorOrganizationId?: number;
      newDebtorOrganization?: NewOrganizationDto;
      funderPersonaId: number;
    },
  ): Promise<{ issuerOrganization: Organization; debtorOrganization: Organization }> {
    const issuerOrganization = await this.resolveOrCreateOrganization(manager, {
      organizationId: params.issuerOrganizationId,
      newOrganization: params.newIssuerOrganization,
      source: 'invoice_issuer',
      funderPersonaId: params.funderPersonaId,
    });
    const debtorOrganization = await this.resolveOrCreateOrganization(manager, {
      organizationId: params.debtorOrganizationId,
      newOrganization: params.newDebtorOrganization,
      source: 'invoice_debtor',
      funderPersonaId: params.funderPersonaId,
    });
    return { issuerOrganization, debtorOrganization };
  }

  private async emitOrganizationCreated(
    manager: EntityManager,
    organization: Organization,
    source: 'invoice_issuer' | 'invoice_debtor',
    funderPersonaId: number,
  ): Promise<void> {
    await this.outboxEventRepository.record(manager, {
      id: uuid(),
      topic: KafkaTopicEnum.ORGANIZATION_CREATED,
      payload: {
        eventId: uuid(),
        organizationId: organization.id,
        organizationName: organization.organizationName,
        businessRegistrationNumber: organization.businessRegistrationNumber ?? null,
        country: organization.country,
        source,
        funderPersonaId,
      },
    });
  }

  async ensureTradeNetwork(
    manager: EntityManager,
    params: {
      funderPersonaId: number;
      issuerOrganizationId: number;
      debtorOrganizationId: number;
      callerSuppliedRelationshipId?: number;
    },
  ): Promise<{ relationshipId: number }> {
    await this.ensureSupplierPersona(manager, params.issuerOrganizationId);
    await this.ensureBuyerPersona(manager, params.debtorOrganizationId);

    if (params.callerSuppliedRelationshipId) {
      return { relationshipId: params.callerSuppliedRelationshipId };
    }

    const relationshipId = await this.ensureRelationship(manager, {
      funderPersonaId: params.funderPersonaId,
      issuerOrganizationId: params.issuerOrganizationId,
      debtorOrganizationId: params.debtorOrganizationId,
    });
    return { relationshipId };
  }
}
