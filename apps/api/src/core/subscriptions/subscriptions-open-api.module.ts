/* @proprietary license */

/**
 * Public subscriptions HTTP surface for OpenAPI export only (no BullMQ / cron).
 */

import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { StripeModule } from '../../utils/stripe/stripe.module';

@Module({
  imports: [SupabaseModule, StripeModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsOpenApiModule {}
