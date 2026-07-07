/* @proprietary license */

/**
 * Minimal Nest graph for `openapi:export:agent`: Agent surface only.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './utils/supabase/supabase.module';
import { AgentModule } from './agent/agent.module';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { PartnersModule } from './partners/partners.module';
import { OAuthModule } from './oauth/oauth.module';
import { ApiKeyGuard } from './core/common/guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    SupabaseModule,
    AgentModule,
    ProvisioningModule,
    PartnersModule,
    OAuthModule,
  ],
  providers: [ApiKeyGuard],
})
export class AgentOpenApiExportModule {}
