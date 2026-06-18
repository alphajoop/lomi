import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { MetersController } from './meters.controller';
import { UsageEventsController } from './usage-events.controller';
import { MetersService } from './meters.service';
import { UsageEventsService } from './usage-events.service';
import { MeteringProcessor } from './processors/metering.processor';
import { BillingProcessor } from './processors/billing.processor';
import { BillingService } from './billing.service';
import { UsageBillingController } from './usage-billing.controller';
import { UsageBillingInternalController } from './usage-billing-internal.controller';
import { InternalCronGuard } from '../common/guards/internal-cron.guard';
import { UsageCreditsService } from './usage-credits.service';
import { EntitlementsService } from './entitlements.service';

@Module({
  imports: [
    SupabaseModule,
    BullModule.registerQueue({
      name: 'metering',
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400, count: 5000 },
      },
    }),
    BullModule.registerQueue({
      name: 'billing',
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 500 },
      },
    }),
  ],
  controllers: [
    MetersController,
    UsageEventsController,
    UsageBillingController,
    UsageBillingInternalController,
  ],
  providers: [
    MetersService,
    UsageEventsService,
    MeteringProcessor,
    BillingService,
    BillingProcessor,
    UsageCreditsService,
    EntitlementsService,
    InternalCronGuard,
  ],
  exports: [UsageEventsService, MetersService, BillingService],
})
export class MeteringModule {}
