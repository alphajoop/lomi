import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiClientService } from './spi-client.service';
import { toProviderAmount } from './spi.utils';

export type InitCheckoutSpiRequestToPayInput = {
  checkoutSessionId: string;
  payeurAlias: string;
};

export type InitCheckoutSpiResult = {
  checkoutSessionId: string;
  spiTxId: string;
  amount: number;
  currency: string;
  expiresAt: string | null;
  transactionId: string | null;
  alreadyInitiated: boolean;
};

type PrepareRpcResult = {
  organization_id: string;
  checkout_session_id: string;
  payment_request_id: string;
  transaction_id: string | null;
  spi_account_number: string;
  spi_tx_id: string;
  amount: number;
  currency_code: string;
  country_code: string;
  expires_at: string | null;
  already_initiated: boolean;
};

/**
 * Hosted-checkout SPI request-to-pay.
 *
 * Public surface: the payer has no JWT, so this is driven entirely by the
 * `checkout_session_id` (the capability). The session is the source of truth for
 * org / amount / currency / customer, the client amount is never trusted.
 *
 * Mirrors {@link SpiPosService} but against an existing checkout session
 * (e-commerce category `521`, non-POS). Completion flows through the shared
 * `complete_pos_spi_payment` webhook RPC (resolves by `spi_tx_id`).
 */
@Injectable()
export class SpiCheckoutService {
  private readonly logger = new Logger(SpiCheckoutService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async initRequestToPay(
    input: InitCheckoutSpiRequestToPayInput,
  ): Promise<InitCheckoutSpiResult> {
    const payeurAlias = input.payeurAlias?.trim();
    if (!payeurAlias) {
      throw new BadRequestException('payeurAlias is required');
    }

    const { data: prepared, error: prepareError } = await this.supabase.rpc(
      'prepare_checkout_spi_payment' as never,
      {
        p_checkout_session_id: input.checkoutSessionId,
      } as never,
    );

    if (prepareError || !prepared) {
      this.logger.error(
        `prepare_checkout_spi_payment failed: ${prepareError?.message}`,
      );
      throw new BadRequestException(
        prepareError?.message ?? 'Failed to prepare checkout SPI payment',
      );
    }

    const prep = prepared as PrepareRpcResult;

    // Idempotent: a payment was already initiated for this session. Skip the
    // PI-SPI call (re-sending the same txId would be rejected) and let the
    // client poll the existing payment to completion.
    if (prep.already_initiated) {
      return {
        checkoutSessionId: prep.checkout_session_id,
        spiTxId: prep.spi_tx_id,
        amount: prep.amount,
        currency: prep.currency_code,
        expiresAt: prep.expires_at,
        transactionId: prep.transaction_id,
        alreadyInitiated: true,
      };
    }

    const checkoutSessionId = prep.checkout_session_id;
    const spiTxId = prep.spi_tx_id;
    const dateLimiteReponse =
      prep.expires_at ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      const montantCentimes = toProviderAmount(prep.amount);
      const spiResponse = await this.spiClient.executeWithSdk(
        prep.organization_id,
        (sdk) =>
          sdk.demandesPaiement.create({
            comptePaye: prep.spi_account_number,
            payeurAlias,
            montant: montantCentimes,
            categorie: '521',
            motif: `Paiement e-commerce - Transaction ${spiTxId}`,
            txId: spiTxId,
            dateLimiteReponse,
            confirmation: false,
          }),
      );

      const spiStatus = (spiResponse.statut ?? 'INITIE') as
        | 'INITIE'
        | 'ENVOYE'
        | 'IRREVOCABLE'
        | 'REJETE';

      const { error: finalizeError } = await this.supabase.rpc(
        'finalize_pos_spi_payment_initiated' as never,
        {
          p_checkout_session_id: checkoutSessionId,
          p_spi_tx_id: spiTxId,
          p_spi_payment_status: spiStatus,
          p_qr_payload: null,
          p_spi_date_limite_reponse: dateLimiteReponse,
          p_spi_date_limite_paiement: dateLimiteReponse,
          p_spi_init_success: true,
        } as never,
      );

      if (finalizeError) {
        throw new InternalServerErrorException(finalizeError.message);
      }

      return {
        checkoutSessionId,
        spiTxId,
        amount: prep.amount,
        currency: prep.currency_code,
        expiresAt: prep.expires_at,
        transactionId: prep.transaction_id,
        alreadyInitiated: false,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'SPI payment initiation failed';

      await this.supabase.rpc(
        'finalize_pos_spi_payment_initiated' as never,
        {
          p_checkout_session_id: checkoutSessionId,
          p_spi_tx_id: spiTxId,
          p_spi_payment_status: 'REJETE',
          p_spi_init_success: false,
          p_spi_error_message: message,
        } as never,
      );

      this.logger.error(`Checkout SPI initiation failed: ${message}`, error);
      throw new BadRequestException(message);
    }
  }

  async getPaymentStatus(checkoutSessionId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_checkout_spi_payment_status' as never,
      {
        p_checkout_session_id: checkoutSessionId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as unknown as Record<string, unknown>;
  }
}
