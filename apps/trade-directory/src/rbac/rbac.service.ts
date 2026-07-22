import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  OrganizationRole,
  Permission,
  PersonRole,
  RolePermission,
} from '../models';
import { RbacAuditEvent } from '../models/rbac-audit-log.entity';
import {
  OrganizationPersonRepository,
  OrganizationRoleRepository,
  PermissionRepository,
  PersonRepository,
  PersonRoleRepository,
  RbacAuditLogRepository,
  RolePermissionRepository,
} from '../repositories';
import { TokenRepository } from '../repositories/token.repository';

export interface RbacRequestContext {
  personId: number;
  orgId: number;
  ipAddress: string | null;
  userAgent: string | null;
}

interface PermissionCacheEntry {
  keys: Set<string>;
  isSuperAdmin: boolean;
  expiresAt: number;
}

const PERMISSION_CACHE_TTL_MS = 30 * 1000;
export const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

/**
 * Dynamic RBAC core (2026-07-22 spec): roles are runtime containers of
 * permission keys; code checks keys, never role names. Tenant scope is the
 * role's organizationId, matched against the caller's JWT orgId.
 *
 * Bypass rules: SQFSYS platform accounts and holders of an immutable role
 * (the per-org Super Admin role) hold every key implicitly — that's what
 * keeps the immutable role meaningful without maintaining its
 * role_permission rows as the dictionary grows.
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly permissionCache = new Map<string, PermissionCacheEntry>();

  constructor(
    private readonly personRepository: PersonRepository,
    private readonly organizationPersonRepository: OrganizationPersonRepository,
    private readonly organizationRoleRepository: OrganizationRoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly personRoleRepository: PersonRoleRepository,
    private readonly rbacAuditLogRepository: RbacAuditLogRepository,
    private readonly tokenRepository: TokenRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // ------------------------------------------------------------------
  // Permission resolution
  // ------------------------------------------------------------------

  async hasPermission(
    personId: number,
    orgId: number,
    permKey: string,
  ): Promise<boolean> {
    const { keys, isSuperAdmin } = await this.resolvePermissions(personId, orgId);
    return isSuperAdmin || keys.has(permKey);
  }

  async resolvePermissions(
    personId: number,
    orgId: number,
  ): Promise<{ keys: Set<string>; isSuperAdmin: boolean }> {
    const cacheKey = `${personId}:${orgId}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const person = await this.personRepository.findOne({ where: { id: personId } });
    if (!person) return { keys: new Set(), isSuperAdmin: false };

    let isSuperAdmin = person.systemRole === 'SQFSYS';
    const keys = new Set<string>();

    if (!isSuperAdmin && orgId > 0) {
      const assignments = await this.personRoleRepository.findByPersonInOrg(
        personId,
        orgId,
      );
      isSuperAdmin = assignments.some((a) => a.role.isImmutable);

      if (!isSuperAdmin) {
        for (const assignment of assignments) {
          const grants = await this.rolePermissionRepository.findByRoleId(
            assignment.role.id,
          );
          for (const grant of grants) keys.add(grant.permission.permKey);
        }
      }
    }

    const entry: PermissionCacheEntry = {
      keys,
      isSuperAdmin,
      expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS,
    };
    this.permissionCache.set(cacheKey, entry);
    return entry;
  }

  /** Single-instance dev: clearing the whole cache on any RBAC write makes
   * permission changes effectively immediate. Multi-instance production
   * would replace this with a Redis broadcast (Terraform phase). */
  private bustCache(): void {
    this.permissionCache.clear();
  }

  // ------------------------------------------------------------------
  // Manifest (drives the frontend — nav + hasPermission, no role checks)
  // ------------------------------------------------------------------

  async getManifest(ctx: RbacRequestContext) {
    const person = await this.personRepository.findOne({
      where: { id: ctx.personId },
    });
    if (!person) throw new NotFoundException('Unknown user');

    const { keys, isSuperAdmin } = await this.resolvePermissions(
      ctx.personId,
      ctx.orgId,
    );
    const dictionary = await this.permissionRepository.find({});
    const permissions = isSuperAdmin
      ? dictionary.map((p) => p.permKey)
      : [...keys];

    const categories: Record<string, string[]> = {};
    for (const perm of dictionary) {
      categories[perm.permCategory] = categories[perm.permCategory] ?? [];
      categories[perm.permCategory].push(perm.permKey);
    }

    const roles =
      ctx.orgId > 0
        ? (
            await this.personRoleRepository.findByPersonInOrg(
              ctx.personId,
              ctx.orgId,
            )
          ).map((a) => ({ id: a.role.id, name: a.role.name }))
        : [];

    return {
      user: {
        personId: person.id,
        name: person.name,
        email: person.email,
        orgId: ctx.orgId,
        isSuperAdmin,
        roles,
      },
      permissions: permissions.sort(),
      categories,
    };
  }

  // ------------------------------------------------------------------
  // Role administration
  // ------------------------------------------------------------------

  async listRoles(ctx: RbacRequestContext) {
    this.assertOrgScope(ctx);
    const roles = await this.organizationRoleRepository.findByOrganization(
      ctx.orgId,
    );
    return Promise.all(
      roles.map(async (role) => ({
        id: role.id,
        name: role.name,
        description: role.description ?? null,
        isImmutable: role.isImmutable,
        permissionKeys: (
          await this.rolePermissionRepository.findByRoleId(role.id)
        ).map((rp) => rp.permission.permKey),
        memberCount: (await this.personRoleRepository.findByRoleId(role.id))
          .length,
        updatedAt: role.updatedAt,
      })),
    );
  }

  async listPermissions() {
    const dictionary = await this.permissionRepository.find({});
    const grouped: Record<
      string,
      { permKey: string; permDescription: string }[]
    > = {};
    for (const perm of dictionary) {
      grouped[perm.permCategory] = grouped[perm.permCategory] ?? [];
      grouped[perm.permCategory].push({
        permKey: perm.permKey,
        permDescription: perm.permDescription,
      });
    }
    return grouped;
  }

  async createRole(
    ctx: RbacRequestContext,
    input: { name: string; description?: string },
  ) {
    this.assertOrgScope(ctx);
    const existing = await this.organizationRoleRepository.findOne({
      where: { name: input.name, organization: { id: ctx.orgId } },
    });
    if (existing) {
      throw new ConflictException(`A role named "${input.name}" already exists`);
    }

    return this.entityManager.transaction(async (manager) => {
      const role = await manager.save(
        OrganizationRole,
        manager.create(OrganizationRole, {
          name: input.name,
          description: input.description,
          isImmutable: false,
          organization: { id: ctx.orgId } as never,
        }),
      );
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.ROLE_CREATED,
          executedByPersonId: ctx.personId,
          organizationId: ctx.orgId,
          targetType: 'role',
          targetId: role.id,
          metadataPayload: {
            transformed_state: { name: role.name, description: role.description ?? null },
          },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        manager,
      );
      this.bustCache();
      return { id: role.id, name: role.name, description: role.description ?? null };
    });
  }

  async updateRole(
    ctx: RbacRequestContext,
    roleId: number,
    input: { name?: string; description?: string },
  ) {
    const role = await this.getOwnOrgRole(ctx, roleId);
    await this.assertMutable(ctx, role, 'update');

    const historical = { name: role.name, description: role.description ?? null };
    if (input.name !== undefined) role.name = input.name;
    if (input.description !== undefined) role.description = input.description;

    return this.entityManager.transaction(async (manager) => {
      await manager.save(OrganizationRole, role);
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.ROLE_UPDATED,
          executedByPersonId: ctx.personId,
          organizationId: ctx.orgId,
          targetType: 'role',
          targetId: role.id,
          metadataPayload: {
            historical_state: historical,
            transformed_state: {
              name: role.name,
              description: role.description ?? null,
            },
          },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        manager,
      );
      this.bustCache();
      return { success: true };
    });
  }

  async deleteRole(ctx: RbacRequestContext, roleId: number) {
    const role = await this.getOwnOrgRole(ctx, roleId);
    await this.assertMutable(ctx, role, 'delete');

    const permKeys = (
      await this.rolePermissionRepository.findByRoleId(role.id)
    ).map((rp) => rp.permission.permKey);
    const members = await this.personRoleRepository.findByRoleId(role.id);

    return this.entityManager.transaction(async (manager) => {
      await manager.delete(OrganizationRole, { id: role.id }); // junctions cascade
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.ROLE_DELETED,
          executedByPersonId: ctx.personId,
          organizationId: ctx.orgId,
          targetType: 'role',
          targetId: role.id,
          metadataPayload: {
            historical_state: {
              name: role.name,
              permission_keys: permKeys,
              member_person_ids: members.map((m) => m.person.id),
            },
          },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        manager,
      );
      this.bustCache();
      return { success: true };
    });
  }

  /** Replaces a role's entire permission set (the Role Builder's save). */
  async setRolePermissions(
    ctx: RbacRequestContext,
    roleId: number,
    permKeys: string[],
  ) {
    const role = await this.getOwnOrgRole(ctx, roleId);
    await this.assertMutable(ctx, role, 'modify permissions of');

    const dictionary = await this.permissionRepository.find({});
    const byKey = new Map(dictionary.map((p) => [p.permKey, p]));
    const unknown = permKeys.filter((k) => !byKey.has(k));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown permission keys: ${unknown.join(', ')}`);
    }

    const historicalKeys = (
      await this.rolePermissionRepository.findByRoleId(role.id)
    ).map((rp) => rp.permission.permKey);

    return this.entityManager.transaction(async (manager) => {
      await manager.delete(RolePermission, { role: { id: role.id } });
      for (const key of new Set(permKeys)) {
        await manager.save(
          RolePermission,
          manager.create(RolePermission, {
            role,
            permission: byKey.get(key) as Permission,
            grantedByPersonId: ctx.personId,
          }),
        );
      }
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.ROLE_PERMISSIONS_CHANGED,
          executedByPersonId: ctx.personId,
          organizationId: ctx.orgId,
          targetType: 'role',
          targetId: role.id,
          metadataPayload: {
            historical_state: { permission_keys: historicalKeys.sort() },
            transformed_state: { permission_keys: [...new Set(permKeys)].sort() },
          },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        manager,
      );
      this.bustCache();
      return { success: true, permissionKeys: [...new Set(permKeys)].sort() };
    });
  }

  // ------------------------------------------------------------------
  // User directory + assignments
  // ------------------------------------------------------------------

  async listUsers(ctx: RbacRequestContext) {
    this.assertOrgScope(ctx);
    const memberships = await this.organizationPersonRepository.find({
      where: { organization: { id: ctx.orgId } },
      relations: ['person'],
    });

    return Promise.all(
      memberships.map(async (membership) => {
        const assignments = await this.personRoleRepository.findByPersonInOrg(
          membership.person.id,
          ctx.orgId,
        );
        return {
          personId: membership.person.id,
          name: membership.person.name,
          email: membership.person.email,
          designation: membership.designation ?? null,
          roles: assignments.map((a) => ({
            id: a.role.id,
            name: a.role.name,
            isImmutable: a.role.isImmutable,
          })),
        };
      }),
    );
  }

  async assignRole(ctx: RbacRequestContext, personId: number, roleId: number) {
    const role = await this.getOwnOrgRole(ctx, roleId);

    const membership = await this.organizationPersonRepository.findOne({
      where: { person: { id: personId }, organization: { id: ctx.orgId } },
      relations: ['person'],
    });
    if (!membership) {
      throw new BadRequestException(
        'Target user is not a member of your organization',
      );
    }

    const existing = await this.personRoleRepository.findOne({
      where: { person: { id: personId }, role: { id: roleId } },
    });
    if (existing) return { success: true }; // idempotent

    const historicalRoles = await this.roleNamesFor(personId, ctx.orgId);

    return this.entityManager.transaction(async (manager) => {
      await manager.save(
        PersonRole,
        manager.create(PersonRole, {
          person: { id: personId } as never,
          role,
          assignedByPersonId: ctx.personId,
        }),
      );
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.USER_ROLE_ASSIGNED,
          executedByPersonId: ctx.personId,
          organizationId: ctx.orgId,
          targetType: 'person',
          targetId: personId,
          metadataPayload: {
            historical_state: { assigned_role_titles: historicalRoles },
            transformed_state: {
              assigned_role_titles: [...historicalRoles, role.name].sort(),
            },
          },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        manager,
      );
      this.bustCache();
      return { success: true };
    });
  }

  async removeRole(ctx: RbacRequestContext, personId: number, roleId: number) {
    const role = await this.getOwnOrgRole(ctx, roleId);

    const assignment = await this.personRoleRepository.findOne({
      where: { person: { id: personId }, role: { id: roleId } },
      relations: ['person', 'role'],
    });
    if (!assignment) throw new NotFoundException('Role assignment not found');

    // "Last Admin" enforcement: never remove the final holder of an
    // immutable role — that would erase all administration pathways.
    if (role.isImmutable) {
      const holders = await this.personRoleRepository.findByRoleId(role.id);
      if (holders.length <= 1) {
        throw new BadRequestException(
          'Cannot remove the last holder of the Super Admin role. Assign another Super Admin first.',
        );
      }
    }

    const historicalRoles = await this.roleNamesFor(personId, ctx.orgId);

    return this.entityManager.transaction(async (manager) => {
      await manager.delete(PersonRole, { id: assignment.id });
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.USER_ROLE_REMOVED,
          executedByPersonId: ctx.personId,
          organizationId: ctx.orgId,
          targetType: 'person',
          targetId: personId,
          metadataPayload: {
            historical_state: { assigned_role_titles: historicalRoles },
            transformed_state: {
              assigned_role_titles: historicalRoles.filter((n) => n !== role.name),
            },
          },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
        manager,
      );
      this.bustCache();
      return { success: true };
    });
  }

  // ------------------------------------------------------------------
  // Audit + session revocation
  // ------------------------------------------------------------------

  async listAudit(ctx: RbacRequestContext, limit = 50, offset = 0) {
    this.assertOrgScope(ctx);
    const [rows, total] = await this.rbacAuditLogRepository.findForOrganization(
      ctx.orgId,
      Math.min(limit, 200),
      offset,
    );
    return { total, rows };
  }

  /** Session kill switch: revokes every active refresh token the target
   * holds (token-family revocation). Their access token dies within its
   * 15-minute TTL; permission-guarded endpoints see changes within the
   * 30s cache window regardless. */
  async revokeSessions(ctx: RbacRequestContext, personId: number) {
    this.assertOrgScope(ctx);
    const membership = await this.organizationPersonRepository.findOne({
      where: { person: { id: personId }, organization: { id: ctx.orgId } },
    });
    if (!membership) {
      throw new BadRequestException(
        'Target user is not a member of your organization',
      );
    }

    const active = await this.tokenRepository.findActiveByPersonId(personId);
    const now = new Date();
    for (const token of active) {
      token.revokedAt = now;
      token.revokedReason = 'FORCE_REVOKE';
    }
    await this.tokenRepository.saveMany(active);

    await this.rbacAuditLogRepository.record({
      event: RbacAuditEvent.SESSIONS_REVOKED,
      executedByPersonId: ctx.personId,
      organizationId: ctx.orgId,
      targetType: 'person',
      targetId: personId,
      metadataPayload: { revoked_session_count: active.length },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    this.bustCache();
    return { success: true, revokedSessions: active.length };
  }

  // ------------------------------------------------------------------
  // Bootstrap helper (SystemSetup + backfill script)
  // ------------------------------------------------------------------

  /** Creates the org's immutable Super Admin role if missing and assigns it
   * to the given person. Runs inside the caller's transaction. */
  async ensureSuperAdminRole(
    manager: EntityManager,
    organizationId: number,
    personId: number,
    executedByPersonId: number | null,
  ): Promise<OrganizationRole> {
    let role = await manager.findOne(OrganizationRole, {
      where: {
        organization: { id: organizationId },
        isImmutable: true,
      },
      relations: ['organization'],
    });
    if (!role) {
      role = await manager.save(
        OrganizationRole,
        manager.create(OrganizationRole, {
          name: SUPER_ADMIN_ROLE_NAME,
          description:
            'Immutable system administration role — holds every permission implicitly.',
          isImmutable: true,
          organization: { id: organizationId } as never,
        }),
      );
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.ROLE_CREATED,
          executedByPersonId,
          organizationId,
          targetType: 'role',
          targetId: role.id,
          metadataPayload: {
            transformed_state: { name: role.name, is_immutable: true },
          },
        },
        manager,
      );
    }

    const existing = await manager.findOne(PersonRole, {
      where: { person: { id: personId }, role: { id: role.id } },
    });
    if (!existing) {
      await manager.save(
        PersonRole,
        manager.create(PersonRole, {
          person: { id: personId } as never,
          role,
          assignedByPersonId: executedByPersonId,
        }),
      );
      await this.rbacAuditLogRepository.record(
        {
          event: RbacAuditEvent.USER_ROLE_ASSIGNED,
          executedByPersonId,
          organizationId,
          targetType: 'person',
          targetId: personId,
          metadataPayload: {
            transformed_state: { assigned_role_titles: [role.name] },
          },
        },
        manager,
      );
    }
    this.bustCache();
    return role;
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private assertOrgScope(ctx: RbacRequestContext): void {
    if (!ctx.orgId || ctx.orgId <= 0) {
      throw new BadRequestException(
        'RBAC administration is organization-scoped — SQFSYS platform accounts bootstrap Funders via system-setup instead.',
      );
    }
  }

  private async getOwnOrgRole(
    ctx: RbacRequestContext,
    roleId: number,
  ): Promise<OrganizationRole> {
    this.assertOrgScope(ctx);
    // Guard against undefined/NaN ids: TypeORM silently drops undefined
    // criteria, which would otherwise match an arbitrary role.
    if (!Number.isInteger(roleId)) {
      throw new BadRequestException('roleId must be an integer');
    }
    const role = await this.organizationRoleRepository.findOneInOrganization(
      roleId,
      ctx.orgId,
    );
    if (!role) throw new NotFoundException('Role not found in your organization');
    return role;
  }

  /** Immutable System Admin Guard: any UPDATE/DELETE aimed at an immutable
   * role is dropped and flagged as a tamper attempt (per spec §4). */
  private async assertMutable(
    ctx: RbacRequestContext,
    role: OrganizationRole,
    action: string,
  ): Promise<void> {
    if (!role.isImmutable) return;
    await this.rbacAuditLogRepository.record({
      event: RbacAuditEvent.TAMPER_ATTEMPT,
      executedByPersonId: ctx.personId,
      organizationId: ctx.orgId,
      targetType: 'role',
      targetId: role.id,
      metadataPayload: { attempted_action: action, role_name: role.name },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    this.logger.warn(
      `Tamper attempt: person ${ctx.personId} tried to ${action} immutable role ${role.id}`,
    );
    throw new ForbiddenException(
      `The ${role.name} role is immutable and cannot be modified.`,
    );
  }

  private async roleNamesFor(personId: number, orgId: number): Promise<string[]> {
    const assignments = await this.personRoleRepository.findByPersonInOrg(
      personId,
      orgId,
    );
    return assignments.map((a) => a.role.name).sort();
  }
}
