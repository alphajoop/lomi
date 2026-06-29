import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { SpiModule } from '../spi/spi.module';
import { PayoutsUnifiedController } from './payouts-unified.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [ConfigModule, SupabaseModule, SpiModule],
  controllers: [PayoutsUnifiedController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
