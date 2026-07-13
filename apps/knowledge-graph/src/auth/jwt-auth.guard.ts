import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

// Verifies the trade-directory-issued access token locally (shared JWT_SECRET)
// rather than round-tripping to trade-directory per request.
// Intended access (future dynamic RBAC): funder staff roles with sales/risk
// visibility. Do not add hardcoded CASL rules here.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    try {
      const payload = jwt.verify(
        token,
        this.configService.getOrThrow('JWT_SECRET'),
      ) as { userId: number; orgId: number };
      request.user = { id: payload.userId, orgId: payload.orgId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
