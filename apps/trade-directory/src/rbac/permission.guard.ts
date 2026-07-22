import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../auth/interface/token.interface';
import { RbacService } from './rbac.service';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

/**
 * Declares the permission key an endpoint requires. Code references keys,
 * never roles — the whole point of the Dynamic RBAC design. Use together
 * with PermissionGuard:
 *
 *   @UseGuards(PermissionGuard)
 *   @RequirePermission('risk_models_edit')
 */
export const RequirePermission = (permKey: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permKey);

/**
 * Bearer JWT verification + live permission check. Accepts the SQFSYS
 * sentinel orgId 0 (platform accounts bypass permission checks entirely,
 * as do holders of an immutable role — see RbacService). Permissions are
 * resolved from the database per request (short in-process cache), so a
 * Super Admin's change takes effect without waiting for token expiry.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers?.authorization || request.headers?.Authorization;
    if (!authorization) return false;

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) return false;

    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(token);
    } catch {
      return false;
    }
    request.userContext = { id: payload.userId, orgId: payload.orgId };

    const requiredKey = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredKey) return true; // authentication-only endpoint

    const allowed = await this.rbacService.hasPermission(
      payload.userId,
      payload.orgId,
      requiredKey,
    );
    if (!allowed) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredKey}`,
      );
    }
    return true;
  }
}
