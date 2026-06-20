import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../../utils/supabase/supabase.module';
import { TelemetryModule } from '../../../utils/telemetry/telemetry.module';
import { WebhookSenderService } from '../../webhook-sender.service';
import { SpiWebhookController } from './spi-webhook.controller';
import { SpiWebhookService } from './spi-webhook.service';

@Module({
  imports: [SupabaseModule, TelemetryModule],
  controllers: [SpiWebhookController],
  providers: [SpiWebhookService, WebhookSenderService],
  exports: [SpiWebhookService],
})
export class SpiWebhookModule {}
