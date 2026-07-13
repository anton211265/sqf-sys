import {
  AuthenticateDto,
  AuthenticateResponse,
} from '@app/common/apps/trade-directory/proto/auth';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RefreshResponseDto } from './dto/response/refresh-response.dto';
import { OrganizationsDto } from './dto/request/organizations.dto';
import { OrganizationsResponseDto } from './dto/response/organizations-response.dto';
import { LogoutDto } from './dto/request/logout.dto';
import { LogoutResponseDto } from './dto/response/logout-response.dto';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { ResetPasswordDto } from './dto/request/reset-password.dto';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/trade-directory/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

@Controller('auth')
export class AuthController {
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiBearerAuth('id-token')
  async authenticateRest(@Headers() headers: { authorization: string }) {
    if (!headers.authorization) {
      throw new BadRequestException('Authorization header not found');
    }
    const [bearer, token] = headers.authorization.split(' ');
    if (bearer !== 'Bearer') {
      throw new BadRequestException('Invalid authorization header');
    }
    if (!token) {
      throw new BadRequestException('Token not found');
    }
    return await this.authService.authenticate(token);
  }

  @Post('dummy-login')
  async authenticateDummy(
    @Body()
    data: {
      username: string;
      password: string;
      inputOrganizationName: string;
      inputOrganizationPersonName: string;
    },
  ) {
    return await this.authService.dummyAuthenticate(data);
  }

  @Post('organizations')
  async organizations(
    @Body() organizationsDto: OrganizationsDto,
  ): Promise<OrganizationsResponseDto> {
    return this.authService.organizations(organizationsDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { email, password, orgId } = loginDto;
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null;
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    const { accessToken, refreshToken } = await this.authService.login(email, password, orgId, userAgent, ipAddress);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS(this.isProduction));
    return { accessToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null;
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(refreshToken, userAgent, ipAddress);
    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS(this.isProduction));
    return { accessToken };
  }

  @Post('logout')
  async logout(
    @Body() _body: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null;
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    if (refreshToken) {
      await this.authService.logout(refreshToken, userAgent, ipAddress);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/trade-directory/auth' });
    return { message: 'Logged out successfully' };
  }

  @Post('reset')
  async reset(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null;
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    return this.authService.resetPassword(resetPasswordDto, userAgent, ipAddress);
  }

  @MessagePattern(KafkaTopicEnum.AUTHENTICATE)
  async authenticate(
    @Payload() { token }: { token: string },
  ): Promise<IUserContext> {
    return this.authService.kafkaAuthenticate(token);
  }

  async authenticateGrpc(
    request: AuthenticateDto,
  ): Promise<AuthenticateResponse> {
    try {
      return await this.authService.authenticate(request.token);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw new RpcException(error.getResponse());
      }
      throw error;
    }
  }
}
