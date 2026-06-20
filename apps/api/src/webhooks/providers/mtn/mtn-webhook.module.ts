import { Module } from '@nestjs/common';
import { MtnWebhookController } from './mtn-webhook.controller';
import { MtnWebhookService } from './mtn-webhook.service';
import { SupabaseModule } from '../../../utils/supabase/supabase.module';
import { TelemetryModule } from '../../../utils/telemetry/telemetry.module';
import { WebhookSenderService } from '../../webhook-sender.service';

@Module({
  imports: [SupabaseModule, TelemetryModule],
  controllers: [MtnWebhookController],
  providers: [MtnWebhookService, WebhookSenderService],
  exports: [MtnWebhookService],
})
export class MtnWebhookModule {}
