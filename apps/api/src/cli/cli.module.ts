import { Module } from '@nestjs/common';
import { CliListenController } from './cli-listen.controller';
import { CliTriggerController } from './cli-trigger.controller';
import { CliListenerService } from './cli-listener.service';
import { CliStreamService } from './cli-stream.service';
import { CliTriggerService } from './cli-trigger.service';
import { SupabaseModule } from '../utils/supabase/supabase.module';
import { ApiKeyGuard } from '../core/common/guards/api-key.guard';

@Module({
  imports: [SupabaseModule],
  controllers: [CliListenController, CliTriggerController],
  providers: [
    CliListenerService,
    CliStreamService,
    CliTriggerService,
    ApiKeyGuard,
  ],
  exports: [CliListenerService, CliStreamService],
})
export class CliModule {}
