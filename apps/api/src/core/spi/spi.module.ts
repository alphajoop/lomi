import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../utils/supabase/supabase.module';
import { SpiCheckoutService } from './spi-checkout.service';
import { SpiClientService } from './spi-client.service';
import { SpiInvoicingService } from './spi-invoicing.service';
import { SpiPosService } from './spi-pos.service';
import { SpiTokenService } from './spi-token.service';
import { SpiBalanceSyncService } from './spi-balance-sync.service';
import { SpiPayoutExecutionService } from './spi-payout-execution.service';
import { SpiBnplService } from './spi-bnpl.service';

@Module({
  imports: [SupabaseModule],
  providers: [
    SpiTokenService,
    SpiClientService,
    SpiPosService,
    SpiCheckoutService,
    SpiInvoicingService,
    SpiBalanceSyncService,
    SpiPayoutExecutionService,
    SpiBnplService,
  ],
  exports: [
    SpiTokenService,
    SpiClientService,
    SpiPosService,
    SpiCheckoutService,
    SpiInvoicingService,
    SpiBalanceSyncService,
    SpiPayoutExecutionService,
    SpiBnplService,
  ],
})
export class SpiModule {}
