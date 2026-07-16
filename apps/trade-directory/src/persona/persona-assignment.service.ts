import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BuyerPersona } from '../models/buyer-persona.entity';
import { Organization } from '../models/organization.entity';
import { SupplierPersona } from '../models/supplier-persona.entity';

// Extracted out of InvoiceTradeNetworkService (2026-07-15) so both the
// invoice-driven trade network AND manual relationship creation
// (RelationshipService) go through the same persona-assignment logic —
// see CLAUDE.md "Manual relationship creation didn't assign personas" for
// why this was a real bug, not just a naming cleanup: relationships created
// via the "+ New relationship" UI were leaving fromOrganization/
// toOrganization with no Supplier/Buyer persona at all, unlike invoices.
//
// Every method takes the transactional `manager` so callers can run this
// inside their own `entityManager.transaction(...)` block.
@Injectable()
export class PersonaAssignmentService {
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
}
