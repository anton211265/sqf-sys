import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PortalApplicationService } from './portal-application.service';
import { PortalJwtGuard } from './portal-jwt.guard';

/**
 * DTO note (ValidationPipe whitelist): every property carries a decorator.
 * The wizard payload is a free-shape object validated semantically at
 * submit time by the service.
 */
class SaveDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  productCode?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

/**
 * Customer Portal pass 1 — client-facing application endpoints. Gating is
 * org membership (PortalJwtGuard row-scopes to the caller's own orgId);
 * clients hold no funder permission keys by design.
 */
@Controller('api/portal/application')
@UseGuards(PortalJwtGuard)
export class PortalApplicationController {
  constructor(private readonly portalApplicationService: PortalApplicationService) {}

  @Get()
  getOrCreate(@Req() req: any) {
    return this.portalApplicationService.getOrCreateDraft(this.ctx(req));
  }

  @Put()
  save(@Req() req: any, @Body() dto: SaveDraftDto) {
    return this.portalApplicationService.saveDraft(this.ctx(req), dto);
  }

  @Post('submit')
  submit(@Req() req: any) {
    return this.portalApplicationService.submit(this.ctx(req));
  }

  @Get('status')
  status(@Req() req: any) {
    return this.portalApplicationService.getStatus(this.ctx(req));
  }

  /** The onboarding config the wizard needs (active products, policies). */
  @Get('onboarding-config')
  onboardingConfig() {
    return this.portalApplicationService.fetchOnboardingConfig();
  }

  private ctx(req: any) {
    return { personId: req.userContext.id, orgId: req.userContext.orgId };
  }
}
