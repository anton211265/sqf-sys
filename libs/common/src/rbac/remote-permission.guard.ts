import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

/**
 * Same contract as trade-directory's RequirePermission — code references
 * permission KEYS, never roles.
 */
export const RequirePermission = (permKey: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permKey);

interface CachedGrant {
  permissions: Set<string>;
  isSuperAdmin: boolean;
  expiresAt: number;
}

/**
 * Cross-service Dynamic RBAC enforcement. The JWT is verified locally
 * (shared JWT_SECRET), but the permission set is resolved by calling
 * trade-directory's existing GET /api/rbac/manifest with the caller's own
 * bearer token — trade-directory stays the single authority over
 * roles/permissions, this service holds no copy of those tables, and no new
 * trade-directory endpoint is needed. A 30-second in-process cache mirrors
 * the freshness semantics of trade-directory's own guard (single-instance
 * dev; production moves this to a Redis-backed check, same Terraform-phase
 * story as the passkey TTL maps).
 */
@Injectable()
export class RemotePermissionGuard implements CanActivate {
  private readonly logger = new Logger(RemotePermissionGuard.name);
  private readonly cache = new Map<string, CachedGrant>();
  private static readonly CACHE_TTL_MS = 30_000;
  private static readonly CACHE_MAX_ENTRIES = 500;

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers?.authorization || request.headers?.Authorization;
    if (!authorization) return false;

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) return false;

    let payload: { userId: number; orgId: number };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      return false;
    }
    request.userContext = { id: payload.userId, orgId: payload.orgId };

    const requiredKey = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredKey) return true; // authentication-only endpoint

    const grant = await this.resolveGrant(token, authorization);
    if (!grant) return false;
    if (!grant.isSuperAdmin && !grant.permissions.has(requiredKey)) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredKey}`,
      );
    }
    // Expose the resolved grant so handlers can branch on ADDITIONAL keys
    // (e.g. an org-wide "team" scope needing a supervisor key on top of the
    // endpoint's gate) without a second manifest round-trip.
    request.userContext.permissions = grant.permissions;
    request.userContext.isSuperAdmin = grant.isSuperAdmin;
    return true;
  }

  private async resolveGrant(
    token: string,
    authorization: string,
  ): Promise<CachedGrant | null> {
    const cacheKey = createHash('sha256').update(token).digest('hex');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const manifestUrl =
      this.configService.getOrThrow<string>('RBAC_MANIFEST_URL');
    let response: Response;
    try {
      response = await fetch(manifestUrl, {
        headers: { Authorization: authorization },
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      this.logger.error(`RBAC manifest call failed: ${error}`);
      return null; // fail closed
    }
    if (!response.ok) return null;

    const manifest = (await response.json()) as {
      user?: { isSuperAdmin?: boolean };
      permissions?: string[];
    };
    const grant: CachedGrant = {
      permissions: new Set(manifest.permissions ?? []),
      isSuperAdmin: manifest.user?.isSuperAdmin === true,
      expiresAt: Date.now() + RemotePermissionGuard.CACHE_TTL_MS,
    };
    if (this.cache.size >= RemotePermissionGuard.CACHE_MAX_ENTRIES) {
      this.cache.clear();
    }
    this.cache.set(cacheKey, grant);
    return grant;
  }
}
