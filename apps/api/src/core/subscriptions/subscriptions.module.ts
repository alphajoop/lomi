import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionRenewalsInternalController } from './subscription-renewals-internal.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionRenewalsService } from './subscription-renewals.service';
import { SubscriptionRenewalsProcessor } from './processors/subscription-renewals.processor';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { StripeModule } from '../../utils/stripe/stripe.module';
import { InternalCronGuard } from '../common/guards/internal-cron.guard';

@Module({
  imports: [
    SupabaseModule,
    StripeModule,
    BullModule.registerQueue({
      name: 'subscription-renewals',
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 500 },
      },
    }),
  ],
  controllers: [
    SubscriptionsController,
    SubscriptionRenewalsInternalController,
  ],
  providers: [
    SubscriptionsService,
    SubscriptionRenewalsService,
    SubscriptionRenewalsProcessor,
    InternalCronGuard,
  ],
  exports: [SubscriptionsService, SubscriptionRenewalsService],
})
export class SubscriptionsModule {}
