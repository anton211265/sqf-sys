import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../auth/interface/token.interface';

@Injectable()
export class SystemSetupGuard implements CanActivate {
  private readonly logger = new Logger(SystemSetupGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers?.authorization || request.headers?.Authorization;

    if (!authorization) {
      return false;
    }

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return false;
    }

    try {
      const payload: TokenPayload = this.jwtService.verify(token);
      request.userContext = { id: payload.userId, orgId: payload.orgId };
      return true;
    } catch (err) {
      this.logger.error('Invalid JWT in system-setup request', err);
      return false;
    }
  }
}
