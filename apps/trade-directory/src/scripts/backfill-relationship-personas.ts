import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { RelationshipTypeEnum } from '@app/common/apps/trade-directory/enums/relationship-type.enum';
import { Organization, Relationship } from '../models';
import { PersonaAssignmentService } from '../persona/persona-assignment.service';
import { TradeDirectoryModule } from '../trade-directory.module';

// One-off backfill for the RelationshipService.create() persona-assignment
// bug fixed 2026-07-16 (see CLAUDE.md Working Agreement) — manually-created
// SUPPLIES_TO relationships never got Supplier/Buyer personas assigned,
// unlike invoice-created ones. Idempotent: PersonaAssignmentService already
// no-ops on an organization that already has the persona, so this is safe
// to re-run.
async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);
  const entityManager = app.get(EntityManager);
  const personaAssignmentService = app.get(PersonaAssignmentService);

  const relationships = await entityManager.find(Relationship, {
    where: { relationshipType: RelationshipTypeEnum.SUPPLIES_TO },
  });

  logger.log(
    `Found ${relationships.length} SUPPLIES_TO relationship(s) to check.`,
  );

  let fixedCount = 0;

  for (const relationship of relationships) {
    await entityManager.transaction(async (manager) => {
      const [fromOrg, toOrg] = await Promise.all([
        manager.findOneOrFail(Organization, {
          where: { id: relationship.fromOrganizationId },
        }),
        manager.findOneOrFail(Organization, {
          where: { id: relationship.toOrganizationId },
        }),
      ]);

      const missingSupplier = !fromOrg.supplierPersonaId;
      const missingBuyer = !toOrg.buyerPersonaId;

      if (!missingSupplier && !missingBuyer) return;

      if (missingSupplier) {
        await personaAssignmentService.ensureSupplierPersona(
          manager,
          fromOrg.id,
        );
        logger.log(
          `Relationship ${relationship.id}: assigned Supplier persona to organization ${fromOrg.id} (${fromOrg.organizationName}).`,
        );
      }
      if (missingBuyer) {
        await personaAssignmentService.ensureBuyerPersona(manager, toOrg.id);
        logger.log(
          `Relationship ${relationship.id}: assigned Buyer persona to organization ${toOrg.id} (${toOrg.organizationName}).`,
        );
      }
      fixedCount += 1;
    });
  }

  logger.log(
    `Done. ${fixedCount} of ${relationships.length} relationship(s) had a missing persona backfilled.`,
  );

  await app.close();
}

bootstrap();
