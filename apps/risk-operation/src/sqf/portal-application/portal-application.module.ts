import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { RemotePermissionGuard } from '@app/common/rbac/remote-permission.guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Application } from '../../models/application.entity';
import { RiskApplicationScoring } from '../../models/risk-application-scoring.entity';
import { RiskAuditLog } from '../../models/risk-governance.entity';
import { RiskProfile } from '../../models/risk-profile.entity';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { RiskQuantitativeProfileScoringModule } from '../risk-quantitative-profile-scoring/risk-quantitative-profile-scoring.module';
import { OffersModule } from '../offers/offers.module';
import { IntakeAdminController } from './intake-admin.controller';
import { IntakeConsumerController } from './intake-consumer.controller';
import { PortalApplicationController } from './portal-application.controller';
import { PortalApplicationService } from './portal-application.service';
import { PortalJwtGuard } from './portal-jwt.guard';

/**
 * Customer Portal pass 1 (2026-07-24): web-intake application lifecycle —
 * client wizard endpoints (org-membership gating), Filter-1 scoring on
 * submit, APPLICATION_SCORED emission for the CRM queue projection, SLA
 * timers for the RM engagement window, and the funder-facing intake/CRC
 * bucket + RM override endpoints.
 */
@Module({
  imports: [
    DatabaseModule.forFeature([
      Application,
      RiskApplicationScoring,
      RiskProfile,
      RiskAuditLog,
      OutboxEvent,
      ProcessedEvent,
    ]),
    RiskQuantitativeProfileScoringModule,
    OffersModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    PortalApplicationController,
    IntakeAdminController,
    IntakeConsumerController,
  ],
  providers: [
    PortalApplicationService,
    PortalJwtGuard,
    RemotePermissionGuard,
    OutboxEventRepository,
    ProcessedEventRepository,
  ],
})
export class PortalApplicationModule {}
