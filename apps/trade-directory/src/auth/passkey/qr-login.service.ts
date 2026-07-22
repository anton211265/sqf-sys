import {
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';
import { randomBytes, timingSafeEqual } from 'crypto';
import { v4 as uuid } from 'uuid';
import type { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { AuthAuditEvent } from '../../models/auth-audit-log.entity';
import { PersonRepository } from '../../repositories';
import { AuthAuditLogRepository } from '../../repositories/auth-audit-log.repository';
import { AuthService } from '../auth.service';
import { PasskeyService } from './passkey.service';

export const QR_WS_PATH = '/trade-directory/auth/qr/ws';

const QR_SESSION_TTL_MS = 60 * 1000;
const AUTH_CODE_TTL_MS = 30 * 1000;

interface QrSession {
  pin: string;
  createdAt: number;
  desktopIp: string | null;
  desktopUserAgent: string | null;
  desktopDeviceType: 'desktop' | 'mobile';
  ws: WebSocket | null;
  authorized: boolean;
  authCode: string | null;
  personId: number | null;
  orgId: number | null;
  expiryTimer: NodeJS.Timeout;
}

/**
 * Tier-3 cross-device login: a desktop with no usable authenticator shows a
 * QR code; an already-authenticated phone scans it, re-proves biometric
 * presence with its own passkey, and approves. The desktop then exchanges a
 * one-time auth code (delivered over the WebSocket) for its own freshly
 * minted token pair over HTTPS — tokens never transit the WebSocket, and the
 * phone's tokens are never shared with the desktop.
 */
@Injectable()
export class QrLoginService {
  private readonly logger = new Logger(QrLoginService.name);
  private readonly sessions = new Map<string, QrSession>();
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly qrBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly personRepository: PersonRepository,
    private readonly auditLogRepository: AuthAuditLogRepository,
    private readonly authService: AuthService,
    private readonly passkeyService: PasskeyService,
  ) {
    this.qrBaseUrl =
      this.configService.get<string>('QR_LOGIN_BASE_URL') ??
      this.configService
        .getOrThrow<string>('FRONTEND_DOMAIN')
        .split(',')[0]
        .trim();
  }

  /** Called once from main.ts with the underlying Nest HTTP server. */
  attachWebSocketServer(server: Server): void {
    const wss = new WebSocketServer({ server, path: QR_WS_PATH });
    wss.on('connection', (ws, req) => {
      const url = new URL(req.url ?? '', 'http://localhost');
      const qrSessionId = url.searchParams.get('qrSessionId');
      const session = qrSessionId ? this.sessions.get(qrSessionId) : undefined;

      if (!session) {
        ws.send(JSON.stringify({ status: 'SESSION_INVALID' }));
        ws.close();
        return;
      }

      session.ws = ws;
    });
    this.logger.log(`QR login WebSocket listening on ${QR_WS_PATH}`);
  }

  async initiate(
    desktopIp: string | null,
    desktopUserAgent: string | null,
  ): Promise<{ qrSessionId: string; expiresInSeconds: number; loginUrl: string }> {
    const qrSessionId = uuid();
    const pin = randomBytes(24).toString('base64url');

    const expiryTimer = setTimeout(() => {
      const session = this.sessions.get(qrSessionId);
      if (!session) return;
      this.notifyAndClose(session, { status: 'SESSION_EXPIRED' });
      this.sessions.delete(qrSessionId);
    }, QR_SESSION_TTL_MS);
    expiryTimer.unref();

    this.sessions.set(qrSessionId, {
      pin,
      createdAt: Date.now(),
      desktopIp,
      desktopUserAgent,
      desktopDeviceType: this.deviceType(desktopUserAgent),
      ws: null,
      authorized: false,
      authCode: null,
      personId: null,
      orgId: null,
      expiryTimer,
    });

    await this.auditLogRepository.record({
      event: AuthAuditEvent.QR_LOGIN_INITIATED,
      email: 'unknown',
      outcome: 'SUCCESS',
      personId: null,
      ipAddress: desktopIp,
      userAgent: desktopUserAgent,
      detail: `qrSessionId=${qrSessionId}`,
    });

    return {
      qrSessionId,
      expiresInSeconds: QR_SESSION_TTL_MS / 1000,
      // Pin travels in the URL fragment so it never reaches server/proxy logs
      loginUrl: `${this.qrBaseUrl}/mobile-auth?session=${qrSessionId}#pin=${pin}`,
    };
  }

  /**
   * Called by the phone (JWT-authenticated) after scanning the QR code and
   * completing a fresh passkey assertion. On success the desktop's WebSocket
   * receives a single-use auth code.
   */
  async authorizeMobile(
    mobilePersonId: number,
    mobileOrgId: number,
    dto: {
      qrSessionId: string;
      pin: string;
      reauthSessionId: string;
      response: AuthenticationResponseJSON;
    },
    mobileIp: string | null,
    mobileUserAgent: string | null,
  ): Promise<{ success: true }> {
    const session = this.sessions.get(dto.qrSessionId);
    if (!session) {
      throw new GoneException('QR code has expired. Refresh the desktop page.');
    }

    // Strict single-attempt pin: any mismatch kills the whole session
    if (!this.safeEqual(session.pin, dto.pin)) {
      this.killSession(dto.qrSessionId, session);
      await this.auditLogRepository.record({
        event: AuthAuditEvent.QR_LOGIN_REJECTED,
        email: 'unknown',
        outcome: 'FAILURE',
        personId: mobilePersonId,
        ipAddress: mobileIp,
        userAgent: mobileUserAgent,
        detail: `qrSessionId=${dto.qrSessionId} — pin mismatch`,
      });
      throw new ForbiddenException('Security violation: invalid authorization pin.');
    }

    // Device metadata checks (QRLjacking mitigation): the approving device
    // should be a phone on the same network as the desktop. Strict in
    // production; warn-only in dev where curl/E2E traffic is legitimate.
    const mobileDeviceType = this.deviceType(mobileUserAgent);
    const sameIp =
      !session.desktopIp || !mobileIp || session.desktopIp === mobileIp;
    const rolesValid =
      mobileDeviceType === 'mobile' && session.desktopDeviceType === 'desktop';

    if (!sameIp || !rolesValid) {
      const detail = `qrSessionId=${dto.qrSessionId} desktopIp=${session.desktopIp} mobileIp=${mobileIp} desktopDevice=${session.desktopDeviceType} mobileDevice=${mobileDeviceType}`;
      if (this.isProduction) {
        this.killSession(dto.qrSessionId, session);
        await this.auditLogRepository.record({
          event: AuthAuditEvent.QR_LOGIN_REJECTED,
          email: 'unknown',
          outcome: 'FAILURE',
          personId: mobilePersonId,
          ipAddress: mobileIp,
          userAgent: mobileUserAgent,
          detail: `${detail} — device metadata mismatch`,
        });
        throw new ForbiddenException(
          'Authentication rejected: approving device context does not match the requesting desktop.',
        );
      }
      this.logger.warn(`[dev] QR device metadata mismatch tolerated: ${detail}`);
    }

    // Fresh biometric proof — a stolen phone with an open session is not enough
    const person = await this.passkeyService.verifyReauth(
      dto.reauthSessionId,
      dto.response,
      mobilePersonId,
      mobileUserAgent,
      mobileIp,
    );

    // Rotate the session into its authorized, code-bearing phase
    clearTimeout(session.expiryTimer);
    session.authorized = true;
    session.personId = person.id;
    session.orgId = mobileOrgId;
    session.authCode = randomBytes(48).toString('base64url');
    session.pin = randomBytes(24).toString('base64url'); // old pin unusable
    session.expiryTimer = setTimeout(() => {
      this.notifyAndClose(session, { status: 'SESSION_EXPIRED' });
      this.sessions.delete(dto.qrSessionId);
    }, AUTH_CODE_TTL_MS);
    session.expiryTimer.unref();

    // The desktop receives only the one-time code — never a token. It must
    // exchange it over HTTPS (POST /auth/qr/complete) so the refresh token
    // can be set as an httpOnly cookie, which a WebSocket cannot do.
    this.notifyAndClose(session, {
      status: 'AUTH_SUCCESS',
      authCode: session.authCode,
    });

    await this.auditLogRepository.record({
      event: AuthAuditEvent.QR_LOGIN_APPROVED,
      email: person.email,
      outcome: 'SUCCESS',
      personId: person.id,
      ipAddress: mobileIp,
      userAgent: mobileUserAgent,
      detail: `qrSessionId=${dto.qrSessionId}`,
    });

    return { success: true };
  }

  /** Desktop exchanges the one-time auth code for its own session tokens. */
  async complete(
    qrSessionId: string,
    authCode: string,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = this.sessions.get(qrSessionId);
    if (!session || !session.authorized || !session.authCode || !session.personId) {
      throw new UnauthorizedException('QR login session is not ready or has expired');
    }

    // Single-use: consume the session before any further work
    this.sessions.delete(qrSessionId);
    clearTimeout(session.expiryTimer);

    if (!this.safeEqual(session.authCode, authCode)) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    const person = await this.personRepository.findOne({
      where: { id: session.personId },
    });
    if (!person) throw new UnauthorizedException('Unknown user');

    return this.authService.issueSession(
      person,
      session.orgId ?? 0,
      userAgent,
      ipAddress,
      AuthAuditEvent.QR_LOGIN_COMPLETED,
    );
  }

  private killSession(qrSessionId: string, session: QrSession): void {
    clearTimeout(session.expiryTimer);
    this.notifyAndClose(session, { status: 'SESSION_INVALID' });
    this.sessions.delete(qrSessionId);
  }

  private notifyAndClose(session: QrSession, payload: Record<string, unknown>): void {
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(payload));
      session.ws.close();
    }
    session.ws = null;
  }

  private deviceType(userAgent: string | null): 'desktop' | 'mobile' {
    const ua = (userAgent ?? '').toLowerCase();
    return ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')
      ? 'mobile'
      : 'desktop';
  }

  private safeEqual(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) return false;
    return timingSafeEqual(bufferA, bufferB);
  }
}
