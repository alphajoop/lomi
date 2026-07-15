import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiClientService } from './spi-client.service';

type InitiatedPayoutRow = {
  payout_id: string;
  spi_tx_id: string;
};

@Injectable()
export class SpiPayoutExecutionService {
  private readonly logger = new Logger(SpiPayoutExecutionService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async executeAfterInitiation(
    organizationId: string,
    payoutMethodId: string,
    amount: number,
    currencyCode: string,
    initiated: InitiatedPayoutRow,
  ) {
    const { payout_id: payoutId, spi_tx_id: spiTxId } = initiated;

    const { data: methodRows, error: methodError } = await this.supabase.rpc(
      'get_spi_payout_method_destination' as never,
      {
        p_organization_id: organizationId,
        p_payout_method_id: payoutMethodId,
      } as never,
    );

    const methodRow = (
      Array.isArray(methodRows) ? methodRows[0] : methodRows
    ) as
      | {
          spi_alias_shid: string | null;
          spi_alias_mbno: string | null;
          spi_account_number: string | null;
        }
      | null
      | undefined;

    if (methodError || !methodRow) {
      await this.failPayout(payoutId, spiTxId, 'Payout method not found');
      throw new Error('Payout method not found');
    }

    const { data: orgAccount } = await this.supabase.rpc(
      'get_spi_account_number' as never,
      {
        p_organization_id: organizationId,
        p_currency_code: currencyCode,
      } as never,
    );

    const payeurAlias = orgAccount as string | null;
    const payeAlias =
      methodRow.spi_alias_shid ??
      methodRow.spi_alias_mbno ??
      methodRow.spi_account_number;

    if (!payeurAlias || !payeAlias) {
      await this.failPayout(
        payoutId,
        spiTxId,
        'Missing SPI alias for payer or payee',
      );
      throw new Error('SPI account or destination alias missing');
    }

    await this.supabase.rpc(
      'update_spi_payout_status' as never,
      {
        p_payout_id: payoutId,
        p_status: 'processing',
        p_spi_tx_id: spiTxId,
      } as never,
    );

    try {
      const spiResponse = (await this.spiClient.executeWithSdk(
        organizationId,
        (sdk) =>
          sdk.paiements.create({
            payeurAlias,
            payeAlias,
            montant: Math.round(amount * 100),
            motif: `Retrait marchand ${amount} ${currencyCode}`,
            txId: spiTxId,
            confirmation: false,
          }),
      )) as { statut?: string; statutRaison?: string };

      if (spiResponse.statut === 'REJETE') {
        await this.failPayout(
          payoutId,
          spiTxId,
          spiResponse.statutRaison ?? 'SPI rejected payout',
        );
        throw new Error('SPI rejected payout');
      }

      return { payoutId, spiTxId, spiStatus: spiResponse.statut };
    } catch (error) {
      if (!(
        error instanceof Error && error.message === 'SPI rejected payout'
      )) {
        await this.failPayout(
          payoutId,
          spiTxId,
          error instanceof Error ? error.message : String(error),
        );
      }
      throw error;
    }
  }

  private async failPayout(payoutId: string, spiTxId: string, error: string) {
    await this.supabase.rpc(
      'fail_spi_payout' as never,
      {
        p_payout_id: payoutId,
        p_spi_tx_id: spiTxId,
        p_error: error,
      } as never,
    );
  }
}
