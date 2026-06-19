import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { RadarController } from './radar.controller';
import { RadarService } from './radar.service';

@Module({
  imports: [SupabaseModule],
  controllers: [RadarController],
  providers: [RadarService],
  exports: [RadarService],
})
export class RadarModule {}
