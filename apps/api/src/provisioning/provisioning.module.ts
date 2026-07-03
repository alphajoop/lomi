import { Module } from '@nestjs/common';
import { SupabaseModule } from '../utils/supabase/supabase.module';
import { ProvisioningKeyGuard } from '../core/common/guards/provisioning-key.guard';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningRepository } from './provisioning.repository';

@Module({
  imports: [SupabaseModule],
  controllers: [ProvisioningController],
  providers: [
    ProvisioningService,
    ProvisioningRepository,
    ProvisioningKeyGuard,
  ],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
