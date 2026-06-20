/* @proprietary license */

/**
 * Minimal Nest graph for `openapi:export:agent` — Agent surface only.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './utils/supabase/supabase.module';
import { AgentModule } from './agent/agent.module';
import { ApiKeyGuard } from './core/common/guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    SupabaseModule,
    AgentModule,
  ],
  providers: [ApiKeyGuard],
})
export class AgentOpenApiExportModule {}
