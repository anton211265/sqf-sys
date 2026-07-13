import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import {
  ClientPersona,
  Contract,
  LendingProductSubscription,
  Organization,
} from '../models';
import {
  ClientPersonaRepository,
  LendingProductSubscriptionRepository,
  OrganizationRepository,
} from '../repositories';
import { LendingProductSubscriptionController } from './lending-product-subscription.controller';
import { LendingProductSubscriptionService } from './lending-product-subscription.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      LendingProductSubscription,
      ClientPersona,
      Contract,
      Organization,
    ]),
  ],
  controllers: [LendingProductSubscriptionController],
  providers: [
    LendingProductSubscriptionService,
    LendingProductSubscriptionRepository,
    ClientPersonaRepository,
    OrganizationRepository,
  ],
  exports: [LendingProductSubscriptionService],
})
export class LendingProductSubscriptionModule {}
