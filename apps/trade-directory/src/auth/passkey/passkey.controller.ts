import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { UserContext } from '@app/common/decorators/user-context.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { COOKIE_OPTIONS, REFRESH_COOKIE } from '../auth.controller';
import { BearerContextGuard } from '../guards/bearer-context.guard';
import { TokenPayload } from '../interface/token.interface';
import {
  EsignVerifyDto,
  IssueEnrollmentTokenDto,
  PasskeyLoginOptionsDto,
  PasskeyLoginVerifyDto,
  PasskeyRegisterOptionsDto,
  PasskeyRegisterVerifyDto,
  QrAuthorizeDto,
  QrCompleteDto,
  RenamePasskeyDto,
} from '../dto/request/passkey.dto';
import { PasskeyService } from './passkey.service';
import { QrLoginService } from './qr-login.service';

const requestMeta = (req: Request) => ({
  ipAddress: (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null,
  userAgent: (req.headers['user-agent'] as string) ?? null,
});

@Controller('auth/passkey')
export class PasskeyController {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(
    private readonly passkeyService: PasskeyService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Two modes: enrollment (body carries a one-time enrollmentToken, no
   * session required — this is the only entry path for accounts with no
   * credential) or add-device (valid Bearer token, no enrollmentToken).
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register-options')
  async registerOptions(
    @Body() dto: PasskeyRegisterOptionsDto,
    @Req() req: Request,
  ) {
    if (dto.enrollmentToken) {
      return this.passkeyService.registrationOptionsForEnrollment(
        dto.enrollmentToken,
      );
    }

    const context = this.bearerContext(req);
    if (!context) {
      throw new UnauthorizedException(
        'Provide an enrollment token or a valid session',
      );
    }
    return this.passkeyService.registrationOptionsForUser(context.userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register-verify')
  async registerVerify(
    @Body() dto: PasskeyRegisterVerifyDto,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    return this.passkeyService.verifyRegistration(
      dto.registrationSessionId,
      dto.response,
      dto.label ?? null,
      userAgent,
      ipAddress,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login-options')
  async loginOptions(@Body() dto: PasskeyLoginOptionsDto) {
    return this.passkeyService.loginOptions(dto.email, dto.orgId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login-verify')
  async loginVerify(
    @Body() dto: PasskeyLoginVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    const { accessToken, refreshToken } = await this.passkeyService.verifyLogin(
      dto.loginSessionId,
      dto.response,
      userAgent,
      ipAddress,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS(this.isProduction));
    return { accessToken };
  }

  @UseGuards(BearerContextGuard)
  @Post('reauth-options')
  async reauthOptions(@UserContext() user: IUserContext) {
    return this.passkeyService.reauthOptions(user.id, user.orgId);
  }

  /**
   * Passkey e-signature ceremony (Customer Portal pass 2): a fresh
   * assertion (verifyReauth) exchanged for a 5-minute JWT bound to the
   * exact document hash — risk-operation verifies it locally (shared
   * JWT_SECRET) before recording the offer acceptance.
   */
  @UseGuards(BearerContextGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('esign-verify')
  async esignVerify(
    @UserContext() user: IUserContext,
    @Body() dto: EsignVerifyDto,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    const { credential } = await this.passkeyService.verifyReauth(
      dto.reauthSessionId,
      dto.response as never,
      user.id,
      userAgent,
      ipAddress,
    );
    const esignToken = this.jwtService.sign(
      {
        purpose: 'esign',
        personId: user.id,
        credentialId: credential.credentialId,
        docSha256: dto.docSha256,
      },
      { expiresIn: '5m' },
    );
    return { esignToken, credentialId: credential.credentialId };
  }

  @UseGuards(BearerContextGuard)
  @Get('credentials')
  async listCredentials(@UserContext() user: IUserContext) {
    return this.passkeyService.listCredentials(user.id);
  }

  @UseGuards(BearerContextGuard)
  @Patch('credentials/:id')
  async renameCredential(
    @UserContext() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenamePasskeyDto,
  ) {
    return this.passkeyService.renameCredential(user.id, id, dto.label);
  }

  @UseGuards(BearerContextGuard)
  @Delete('credentials/:id')
  async revokeCredential(
    @UserContext() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    return this.passkeyService.revokeCredential(user.id, id, userAgent, ipAddress);
  }

  // Access intent: Super Admin (Dynamic RBAC pending) — enforced in-service
  // as SQFSYS-or-SUPERUSER for now.
  @UseGuards(BearerContextGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('enrollment-tokens')
  async issueEnrollmentToken(
    @UserContext() user: IUserContext,
    @Body() dto: IssueEnrollmentTokenDto,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    return this.passkeyService.issueEnrollmentToken(
      user.id,
      user.orgId,
      dto.email,
      userAgent,
      ipAddress,
    );
  }

  private bearerContext(req: Request): TokenPayload | null {
    const authorization = req.headers.authorization;
    if (!authorization) return null;
    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) return null;
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      return null;
    }
  }
}

@Controller('auth/qr')
export class QrLoginController {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(private readonly qrLoginService: QrLoginService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('initiate')
  async initiate(@Req() req: Request) {
    const { ipAddress, userAgent } = requestMeta(req);
    return this.qrLoginService.initiate(ipAddress, userAgent);
  }

  @UseGuards(BearerContextGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('authorize-mobile')
  async authorizeMobile(
    @UserContext() user: IUserContext,
    @Body() dto: QrAuthorizeDto,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    return this.qrLoginService.authorizeMobile(
      user.id,
      user.orgId,
      dto,
      ipAddress,
      userAgent,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('complete')
  async complete(
    @Body() dto: QrCompleteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { ipAddress, userAgent } = requestMeta(req);
    const { accessToken, refreshToken } = await this.qrLoginService.complete(
      dto.qrSessionId,
      dto.authCode,
      userAgent,
      ipAddress,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS(this.isProduction));
    return { accessToken };
  }
}
