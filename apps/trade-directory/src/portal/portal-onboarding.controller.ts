import { Body, Controller, Get, Ip, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Request } from 'express';
import { PortalOnboardingService } from './portal-onboarding.service';

class RegisterDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @Length(2, 150)
  contactName: string;

  @IsString()
  @Length(2, 200)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  businessRegistrationNumber?: string;

  /** ISO 3166-1 alpha-2 registered country of the company. */
  @IsString()
  @Length(2, 2)
  country: string;

  @IsString()
  @MaxLength(80)
  disclaimerCode: string;

  @IsString()
  @Length(64, 64)
  disclaimerHash: string;

  @IsBoolean()
  acceptedTerms: boolean;

  @IsBoolean()
  acceptedPrivacy: boolean;
}

/**
 * Customer Portal public onboarding endpoints (pass 1). Unauthenticated by
 * design — tightly throttled; the disclaimer body itself is served by the
 * product-configurator's public onboarding-config (this controller only
 * proxies the cached copy so the portal has a single backend to talk to
 * for the funnel).
 */
@Controller('portal')
export class PortalOnboardingController {
  constructor(private readonly portalOnboardingService: PortalOnboardingService) {}

  @Get('onboarding-config')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getOnboardingConfig() {
    return this.portalOnboardingService.fetchOnboardingConfig();
  }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  register(@Body() dto: RegisterDto, @Ip() ip: string, @Req() req: Request) {
    return this.portalOnboardingService.register(dto, {
      ipAddress: ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
