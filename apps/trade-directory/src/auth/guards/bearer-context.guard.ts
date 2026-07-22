import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../interface/token.interface';

/**
 * Verifies the Bearer JWT and exposes { id, orgId } as request.userContext.
 * Unlike JwtAuthGuard (passport), this accepts the SQFSYS sentinel orgId 0,
 * so platform accounts can use the passkey-management endpoints too. Same
 * pattern as SystemSetupGuard.
 */
@Injectable()
export class BearerContextGuard implements CanActivate {
  private readonly logger = new Logger(BearerContextGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers?.authorization || request.headers?.Authorization;

    if (!authorization) return false;

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) return false;

    try {
      const payload: TokenPayload = this.jwtService.verify(token);
      request.userContext = { id: payload.userId, orgId: payload.orgId };
      return true;
    } catch {
      return false;
    }
  }
}
