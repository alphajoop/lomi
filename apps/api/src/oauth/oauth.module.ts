import { Module } from '@nestjs/common';
import { SupabaseModule } from '../utils/supabase/supabase.module';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { InternalApiKeyGuard } from '../core/common/guards/internal-api-key.guard';
import { OAuthController } from './oauth.controller';
import { OAuthRepository } from './oauth.repository';
import { OAuthService } from './oauth.service';

@Module({
  imports: [SupabaseModule],
  controllers: [OAuthController],
  providers: [
    OAuthService,
    OAuthRepository,
    SupabaseSessionGuard,
    InternalApiKeyGuard,
  ],
  exports: [OAuthService, OAuthRepository],
})
export class OAuthModule {}
