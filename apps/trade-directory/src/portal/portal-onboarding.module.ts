import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import { AuthAuditLog } from '../models/auth-audit-log.entity';
import { DisclaimerAcceptance } from '../models/disclaimer-acceptance.entity';
import { EnrollmentToken } from '../models/enrollment-token.entity';
import { Organization } from '../models/organization.entity';
import { OrganizationPerson } from '../models/organization-person.entity';
import { Person } from '../models/person.entity';
import { AuthAuditLogRepository } from '../repositories/auth-audit-log.repository';
import { OutboxEventRepository } from '../repositories/outbox-event.repository';
import { PortalOnboardingController } from './portal-onboarding.controller';
import { PortalOnboardingService } from './portal-onboarding.service';

/** Customer Portal pass 1: public self-registration funnel. */
@Module({
  imports: [
    DatabaseModule.forFeature([
      DisclaimerAcceptance,
      Person,
      Organization,
      OrganizationPerson,
      EnrollmentToken,
      AuthAuditLog,
      OutboxEvent,
    ]),
  ],
  controllers: [PortalOnboardingController],
  providers: [
    PortalOnboardingService,
    AuthAuditLogRepository,
    OutboxEventRepository,
  ],
})
export class PortalOnboardingModule {}
