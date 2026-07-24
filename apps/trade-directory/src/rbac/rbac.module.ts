import { DatabaseModule } from '@app/common/database/database.module';
import { Global, Module } from '@nestjs/common';
import {
  Organization,
  OrganizationPerson,
  OrganizationRole,
  Permission,
  Person,
  PersonRole,
  RolePermission,
  Token,
} from '../models';
import { RbacAuditLog } from '../models/rbac-audit-log.entity';
import { AuthAuditLog } from '../models/auth-audit-log.entity';
import { AuthAuditLogRepository } from '../repositories/auth-audit-log.repository';
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
import { PermissionGuard } from './permission.guard';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';

// Global so PermissionGuard/@RequirePermission can be applied in any feature
// module without re-importing (each new endpoint just declares its key).
@Global()
@Module({
  imports: [
    DatabaseModule.forFeature([
      Organization,
      OrganizationPerson,
      OrganizationRole,
      Permission,
      Person,
      PersonRole,
      RolePermission,
      RbacAuditLog,
      AuthAuditLog,
      Token,
    ]),
  ],
  controllers: [RbacController],
  providers: [
    RbacService,
    PermissionGuard,
    OrganizationPersonRepository,
    OrganizationRoleRepository,
    PermissionRepository,
    PersonRepository,
    PersonRoleRepository,
    RbacAuditLogRepository,
    AuthAuditLogRepository,
    RolePermissionRepository,
    TokenRepository,
  ],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
