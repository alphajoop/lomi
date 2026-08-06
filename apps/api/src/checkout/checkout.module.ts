import { Module } from '@nestjs/common';
import { SpiModule } from '../core/spi/spi.module';
import { GimModule } from '../core/gim/gim.module';
import { BnplModule } from '../core/bnpl/bnpl.module';
import { CheckoutSpiController } from './checkout-spi.controller';
import { CheckoutGimController } from './checkout-gim.controller';
import { CheckoutBnplController } from './checkout-bnpl.controller';

@Module({
  imports: [SpiModule, GimModule, BnplModule],
  controllers: [CheckoutSpiController, CheckoutGimController, CheckoutBnplController],
})
export class CheckoutModule {}
