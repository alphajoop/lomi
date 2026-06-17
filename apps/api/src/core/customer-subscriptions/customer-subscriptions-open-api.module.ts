/* @proprietary license */

/**
 * Customer subscriptions HTTP surface for OpenAPI export only.
 */

import { Module } from '@nestjs/common';
import { CustomerSubscriptionsController } from './customer-subscriptions.controller';
import { CustomerSubscriptionsService } from './customer-subscriptions.service';
import { SubscriptionsOpenApiModule } from '../subscriptions/subscriptions-open-api.module';
import { SupabaseModule } from '../../utils/supabase/supabase.module';

@Module({
  imports: [SupabaseModule, SubscriptionsOpenApiModule],
  controllers: [CustomerSubscriptionsController],
  providers: [CustomerSubscriptionsService],
})
export class CustomerSubscriptionsOpenApiModule {}
