/* @proprietary license */

/** OpenAPI export graph — no BullMQ workers. */
import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { MetersController } from './meters.controller';
import { UsageEventsController } from './usage-events.controller';
import { MetersService } from './meters.service';
import { UsageEventsService } from './usage-events.service';
import { BillingService } from './billing.service';
import { UsageBillingController } from './usage-billing.controller';
import { UsageCreditsService } from './usage-credits.service';
import { EntitlementsService } from './entitlements.service';

@Module({
  imports: [SupabaseModule, EventEmitterModule],
  controllers: [
    MetersController,
    UsageEventsController,
    UsageBillingController,
  ],
  providers: [
    MetersService,
    UsageCreditsService,
    EntitlementsService,
    {
      provide: UsageEventsService,
      useFactory: (supabase: SupabaseService, emitter: EventEmitter2) =>
        new UsageEventsService(supabase, null, emitter),
      inject: [SupabaseService, EventEmitter2],
    },
    {
      provide: BillingService,
      useFactory: (supabase: SupabaseService) =>
        new BillingService(supabase, null),
      inject: [SupabaseService],
    },
  ],
})
export class MeteringOpenApiModule {}
