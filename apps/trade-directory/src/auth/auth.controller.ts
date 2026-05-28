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
} from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { LoginResponseDto } from './dto/response/login-response.dto';
import { RefreshResponseDto } from './dto/response/refresh-response.dto';
import { OrganizationsDto } from './dto/request/organizations.dto';
import { OrganizationsResponseDto } from './dto/response/organizations-response.dto';
import { RefreshDto } from './dto/request/refresh.dto';
import { LogoutDto } from './dto/request/logout.dto';
import { LogoutResponseDto } from './dto/response/logout-response.dto';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { ResetPasswordDto } from './dto/request/reset-password.dto';

@Controller('auth')
export class AuthController {
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

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password, orgId } = loginDto;

    return this.authService.login(email, password, orgId);
  }

  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto): Promise<LogoutResponseDto> {
    return this.authService.logout(logoutDto.refreshToken);
  }

  @Post('reset')
  async reset(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
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
