import { Injectable } from '@nestjs/common';
import { SpiPayoutExecutionService } from '../core/spi/spi-payout-execution.service';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class DashboardPayoutsSpiService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiPayoutExecution: SpiPayoutExecutionService,
  ) {}

  async createSpiPayout(
    user: DashboardUserContext,
    body: {
      payoutMethodId: string;
      amount: number;
      currencyCode?: string;
      payoutPin?: string;
      payoutPinSession?: string;
    },
  ) {
    const { data: initiated, error: initError } = await this.supabase.rpc(
      'initiate_spi_payout' as never,
      {
        p_organization_id: user.organizationId,
        p_merchant_id: user.merchantId,
        p_payout_method_id: body.payoutMethodId,
        p_amount: body.amount,
        p_currency_code: body.currencyCode ?? 'XOF',
        p_payout_pin: body.payoutPin ?? null,
        p_payout_pin_session: body.payoutPinSession ?? null,
        p_bypass_payout_pin: false,
      } as never,
    );

    if (initError) {
      throw new BadRequestException(
        initError.message ?? 'Failed to initiate SPI payout',
      );
    }

    const row = Array.isArray(initiated) ? initiated[0] : initiated;
    if (!row) {
      throw new BadRequestException('Failed to initiate SPI payout');
    }

    const { payout_id: payoutId, spi_tx_id: spiTxId } = row as {
      payout_id: string;
      spi_tx_id: string;
    };

    try {
      const result = await this.spiPayoutExecution.executeAfterInitiation(
        user.organizationId,
        body.payoutMethodId,
        body.amount,
        body.currencyCode ?? 'XOF',
        { payout_id: payoutId, spi_tx_id: spiTxId },
      );

      return {
        success: true,
        payoutId: result.payoutId,
        spiTxId: result.spiTxId,
        status: 'processing',
        message: 'SPI payout initiated; settlement continues asynchronously.',
        spiStatus: result.spiStatus,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to execute SPI payout',
      );
    }
  }

  async getPayoutStatus(user: DashboardUserContext, payoutId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_payout_details' as never,
      {
        p_payout_id: payoutId,
        p_organization_id: user.organizationId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    const payout = Array.isArray(data) ? data[0] : data;
    if (!payout) {
      throw new BadRequestException('Payout not found');
    }

    const metadata = (payout as { metadata?: Record<string, unknown> })
      .metadata;

    return {
      payoutId,
      status: (payout as { status: string }).status,
      spiTxId: metadata?.['spi_tx_id'] as string | undefined,
      spiStatus: metadata?.['spi_payment_status'] as string | undefined,
    };
  }
}
