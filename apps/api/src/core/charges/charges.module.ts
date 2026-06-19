import { Module } from '@nestjs/common';
import { ChargesController } from './charges.controller';
import { ChargesService } from './charges.service';
import { CardChargeService } from './card-charge.service';
import { ConfigModule } from '@nestjs/config';
import { StripeModule } from '../../utils/stripe/stripe.module';
import { RadarModule } from '../radar/radar.module';

@Module({
  imports: [ConfigModule, StripeModule, RadarModule],
  controllers: [ChargesController],
  providers: [ChargesService, CardChargeService],
  exports: [ChargesService, CardChargeService],
})
export class ChargesModule {}
