import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { EntityManager } from 'typeorm';
import { OrganizationPersonRole } from '../models';
import { RbacService } from '../rbac/rbac.service';
import { TradeDirectoryModule } from '../trade-directory.module';

/**
 * One-off, idempotent Dynamic RBAC backfill (2026-07-22): for every legacy
 * enum SUPERUSER assignment, create the org's immutable "Super Admin" role
 * (if missing) and assign it to that person. New Funders get this
 * automatically via SystemSetup initialize — this covers orgs that were
 * initialized before Dynamic RBAC existed. Safe to re-run: no-ops on
 * already-backfilled orgs/persons.
 */
async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);
  const rbacService = app.get(RbacService);
  const entityManager = app.get(EntityManager);

  const superuserAssignments = await entityManager.find(OrganizationPersonRole, {
    where: { role: OrganizationPersonRoleEnum.SUPERUSER },
    relations: [
      'organizationPerson',
      'organizationPerson.person',
      'organizationPerson.organization',
    ],
  });

  logger.log(
    `Found ${superuserAssignments.length} legacy SUPERUSER assignment(s) to backfill`,
  );

  for (const assignment of superuserAssignments) {
    const organizationPerson = assignment.organizationPerson;
    if (!organizationPerson?.person || !organizationPerson?.organization) {
      logger.warn(`Skipping assignment ${assignment.id} — missing relations`);
      continue;
    }
    await entityManager.transaction(async (manager) => {
      await rbacService.ensureSuperAdminRole(
        manager,
        organizationPerson.organization.id,
        organizationPerson.person.id,
        null,
      );
    });
    logger.log(
      `Super Admin role ensured for ${organizationPerson.person.email} in org ${organizationPerson.organization.id} (${organizationPerson.organization.organizationName})`,
    );
  }

  await app.close();
}

bootstrap();
