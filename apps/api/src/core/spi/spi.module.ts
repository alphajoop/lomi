import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { SpiClientService } from './spi-client.service';
import { SpiPosService } from './spi-pos.service';

@Module({
  imports: [SupabaseModule],
  providers: [SpiClientService, SpiPosService],
  exports: [SpiClientService, SpiPosService],
})
export class SpiModule {}
