import { Module } from '@nestjs/common';
import { SupabaseModule } from '../utils/supabase/supabase.module';
import { PartnerKeyGuard } from '../core/common/guards/partner-key.guard';
import { PartnersController } from './partners.controller';
import { PartnersRepository } from './partners.repository';
import { PartnersService } from './partners.service';

@Module({
  imports: [SupabaseModule],
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepository, PartnerKeyGuard],
})
export class PartnersModule {}
