import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicOnboardingService } from './public-onboarding.service';

/**
 * Public (unauthenticated) onboarding configuration for the Customer
 * Portal's new-user application funnel. Read-only, throttled tighter than
 * the global default.
 */
@Controller('api/public')
export class PublicOnboardingController {
  constructor(private readonly publicOnboardingService: PublicOnboardingService) {}

  @Get('onboarding-config')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  getOnboardingConfig() {
    return this.publicOnboardingService.getOnboardingConfig();
  }
}
