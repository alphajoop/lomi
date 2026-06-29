import { Module } from '@nestjs/common';
import { SpiModule } from '../core/spi/spi.module';
import { GimModule } from '../core/gim/gim.module';
import { CheckoutSpiController } from './checkout-spi.controller';
import { CheckoutGimController } from './checkout-gim.controller';

@Module({
  imports: [SpiModule, GimModule],
  controllers: [CheckoutSpiController, CheckoutGimController],
})
export class CheckoutModule {}
