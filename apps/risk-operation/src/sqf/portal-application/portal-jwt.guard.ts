import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Customer Portal guard (pass 1): verifies the access token locally
 * (shared JWT_SECRET) and attaches { id, orgId } — the caller's orgId is
 * their OWN applicant/client organization. Deliberately NOT
 * RemotePermissionGuard: clients hold no funder permission keys; gating is
 * org membership (approved annotation Q2), enforced by row-scoping every
 * query to userContext.orgId.
 */
@Injectable()
export class PortalJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    let payload: { userId: number; orgId: number };
    try {
      payload = await this.jwtService.verifyAsync(header.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (!Number.isInteger(payload.orgId) || payload.orgId <= 0) {
      throw new UnauthorizedException('Portal access requires an organization-scoped session');
    }
    request.userContext = { id: payload.userId, orgId: payload.orgId };
    return true;
  }
}
