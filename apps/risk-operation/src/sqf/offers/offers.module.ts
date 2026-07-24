import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { RemotePermissionGuard } from '@app/common/rbac/remote-permission.guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Application } from '../../models/application.entity';
import { ProvisionalOffer, RateCardMirror } from '../../models/provisional-offer.entity';
import { OfferAcceptance } from '../../models/offer-acceptance.entity';
import { PortalJwtGuard } from '../portal-application/portal-jwt.guard';
import { PortalOfferController } from './portal-offer.controller';
import { RiskAuditLog } from '../../models/risk-governance.entity';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { OffersController, RateCardMirrorConsumer } from './offers.controller';
import { OffersService } from './offers.service';

/** Provisional Offer workspace (CRC pass 2, 2026-07-24). */
@Module({
  imports: [
    DatabaseModule.forFeature([
      ProvisionalOffer, RateCardMirror, OfferAcceptance, Application, RiskAuditLog,
      OutboxEvent, ProcessedEvent,
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OffersController, PortalOfferController, RateCardMirrorConsumer],
  providers: [OffersService, RemotePermissionGuard, PortalJwtGuard, OutboxEventRepository, ProcessedEventRepository],
  exports: [OffersService],
})
export class OffersModule {}
