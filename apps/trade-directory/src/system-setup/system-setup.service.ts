import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { EntityManager } from 'typeorm';
import { PasskeyService } from '../auth/passkey/passkey.service';
import { RbacService } from '../rbac/rbac.service';
import {
  EnrollmentToken,
  FunderPersona,
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  Person,
} from '../models';
import {
  FunderPersonaRepository,
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { InitializeSystemDto } from './dto/initialize-system.dto';

@Injectable()
export class SystemSetupService {
  private readonly logger = new Logger(SystemSetupService.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly funderPersonaRepository: FunderPersonaRepository,
    private readonly personRepository: PersonRepository,
    private readonly organizationPersonRepository: OrganizationPersonRepository,
    private readonly passkeyService: PasskeyService,
    private readonly rbacService: RbacService,
    private readonly entityManager: EntityManager,
  ) {}

  async initialize(
    dto: InitializeSystemDto,
    callerId: number,
  ): Promise<{
    message: string;
    organizationId: number;
    personId: number;
    enrollmentUrl: string;
    enrollmentExpiresAt: Date;
  }> {
    const caller = await this.personRepository.findOne({ where: { id: callerId } });
    if (!caller || caller.systemRole !== OrganizationPersonRoleEnum.SQFSYS) {
      throw new ForbiddenException(
        'Only the SQFSYS system administrator may run system initialization.',
      );
    }

    const existing = await this.personRepository.findOne({
      where: { email: dto.superAdmin.email },
    });
    if (existing) {
      throw new ConflictException(
        `A user with email ${dto.superAdmin.email} already exists.`,
      );
    }

    return this.entityManager.transaction(async (manager) => {
      // 1 — Create or update Funder Organization
      let funderOrg = await manager.findOne(Organization, {
        where: { organizationName: dto.organization.organizationName },
      });

      if (funderOrg) {
        manager.merge(Organization, funderOrg, dto.organization);
      } else {
        funderOrg = manager.create(Organization, dto.organization);
      }
      funderOrg = await manager.save(Organization, funderOrg);
      this.logger.log(`Funder organization saved: ${funderOrg.organizationName} (id=${funderOrg.id})`);

      // 2 — Ensure FunderPersona exists for this org
      let funderPersona = await manager.findOne(FunderPersona, {
        where: { organization: { id: funderOrg.id } },
      });
      if (!funderPersona) {
        funderPersona = manager.create(FunderPersona, {
          organization: funderOrg,
        });
        await manager.save(FunderPersona, funderPersona);
      }

      // 3 — Create Super Admin person. No password: authentication is
      // passkey-only, so the response carries a one-time enrollment URL
      // instead (SQFSYS hands it to the Super Admin out-of-band).
      const superAdmin = manager.create(Person, {
        name: dto.superAdmin.name,
        email: dto.superAdmin.email,
      });
      const savedAdmin = await manager.save(Person, superAdmin);
      this.logger.log(`Super admin created: ${savedAdmin.email} (id=${savedAdmin.id})`);

      // 4 — Link Super Admin to Funder Org with SUPERUSER role
      const orgPersonRole = manager.create(OrganizationPersonRole, {
        role: OrganizationPersonRoleEnum.SUPERUSER,
      });
      const orgPerson = manager.create(OrganizationPerson, {
        person: savedAdmin,
        organization: funderOrg,
        designation: dto.superAdmin.designation ?? 'Super Admin',
        organizationPersonRoles: [orgPersonRole],
      });
      await manager.save(OrganizationPerson, orgPerson);

      // 4b — Dynamic RBAC: create the org's immutable Super Admin role and
      // assign it (holders carry every permission implicitly; the rest of
      // the RBAC config is the Super Admin's own job, per the narrow
      // initialization-scope ruling).
      await this.rbacService.ensureSuperAdminRole(
        manager,
        funderOrg.id,
        savedAdmin.id,
        callerId,
      );

      // 5 — Issue the Super Admin's one-time passkey enrollment token
      const rawToken = randomBytes(48).toString('base64url');
      const enrollmentExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await manager.save(
        EnrollmentToken,
        manager.create(EnrollmentToken, {
          person: savedAdmin,
          tokenHash: createHash('sha256').update(rawToken).digest('hex'),
          expiresAt: enrollmentExpiresAt,
          usedAt: null,
          createdByPersonId: callerId,
        }),
      );

      return {
        message: 'System initialized successfully.',
        organizationId: funderOrg.id,
        personId: savedAdmin.id,
        enrollmentUrl: this.passkeyService.buildEnrollmentUrl(rawToken),
        enrollmentExpiresAt,
      };
    });
  }
}
