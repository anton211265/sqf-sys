import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { UserContext } from '@app/common/decorators/user-context.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Request } from 'express';
import { PermissionGuard, RequirePermission } from './permission.guard';
import { RbacRequestContext, RbacService } from './rbac.service';

class CreateRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

class SetRolePermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionKeys: string[];
}

class AssignRoleDto {
  // The @IsInt matters beyond validation: the global ValidationPipe runs
  // whitelist:true, which strips any property without a decorator.
  @ApiProperty()
  @IsInt()
  roleId: number;
}

/**
 * Dynamic RBAC administration + permissions manifest. Everything here is
 * tenant-scoped by the caller's JWT orgId. Admin endpoints require the
 * Configuration & Administration permission keys — which the immutable
 * Super Admin role (and SQFSYS) hold implicitly.
 */
@UseGuards(PermissionGuard)
@Controller('api/rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ---- Manifest (any authenticated user) ----

  @Get('manifest')
  async manifest(@UserContext() user: IUserContext, @Req() req: Request) {
    return this.rbacService.getManifest(this.ctx(user, req));
  }

  // ---- Permission dictionary ----

  @RequirePermission('admin_roles_manage')
  @Get('permissions')
  async permissions() {
    return this.rbacService.listPermissions();
  }

  // ---- Roles ----

  @RequirePermission('admin_roles_manage')
  @Get('roles')
  async listRoles(@UserContext() user: IUserContext, @Req() req: Request) {
    return this.rbacService.listRoles(this.ctx(user, req));
  }

  @RequirePermission('admin_roles_manage')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('roles')
  async createRole(
    @UserContext() user: IUserContext,
    @Body() dto: CreateRoleDto,
    @Req() req: Request,
  ) {
    return this.rbacService.createRole(this.ctx(user, req), dto);
  }

  @RequirePermission('admin_roles_manage')
  @Patch('roles/:id')
  async updateRole(
    @UserContext() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    return this.rbacService.updateRole(this.ctx(user, req), id, dto);
  }

  @RequirePermission('admin_roles_manage')
  @Delete('roles/:id')
  async deleteRole(
    @UserContext() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.rbacService.deleteRole(this.ctx(user, req), id);
  }

  @RequirePermission('admin_roles_manage')
  @Put('roles/:id/permissions')
  async setRolePermissions(
    @UserContext() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRolePermissionsDto,
    @Req() req: Request,
  ) {
    return this.rbacService.setRolePermissions(
      this.ctx(user, req),
      id,
      dto.permissionKeys,
    );
  }

  // ---- User directory + assignments ----

  @RequirePermission('admin_users_view')
  @Get('users')
  async listUsers(@UserContext() user: IUserContext, @Req() req: Request) {
    return this.rbacService.listUsers(this.ctx(user, req));
  }

  @RequirePermission('admin_users_assign_roles')
  @Post('users/:personId/roles')
  async assignRole(
    @UserContext() user: IUserContext,
    @Param('personId', ParseIntPipe) personId: number,
    @Body() dto: AssignRoleDto,
    @Req() req: Request,
  ) {
    return this.rbacService.assignRole(this.ctx(user, req), personId, dto.roleId);
  }

  @RequirePermission('admin_users_assign_roles')
  @Delete('users/:personId/roles/:roleId')
  async removeRole(
    @UserContext() user: IUserContext,
    @Param('personId', ParseIntPipe) personId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Req() req: Request,
  ) {
    return this.rbacService.removeRole(this.ctx(user, req), personId, roleId);
  }

  // ---- Audit ledger + session kill switch ----

  @RequirePermission('admin_audit_view')
  @Get('audit')
  async audit(
    @UserContext() user: IUserContext,
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.rbacService.listAudit(
      this.ctx(user, req),
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @RequirePermission('admin_sessions_terminate')
  @Post('users/:personId/revoke-sessions')
  async revokeSessions(
    @UserContext() user: IUserContext,
    @Param('personId', ParseIntPipe) personId: number,
    @Req() req: Request,
  ) {
    return this.rbacService.revokeSessions(this.ctx(user, req), personId);
  }

  private ctx(user: IUserContext, req: Request): RbacRequestContext {
    return {
      personId: user.id,
      orgId: user.orgId,
      ipAddress: (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null,
      userAgent: (req.headers['user-agent'] as string) ?? null,
    };
  }
}
