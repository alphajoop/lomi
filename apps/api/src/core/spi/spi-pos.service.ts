import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiClientService } from './spi-client.service';
import { normalizeUemoaCountryCode, toProviderAmount } from './spi.utils';

export type InitPosSpiQrPaymentInput = {
  organizationId: string;
  merchantId: string;
  amount: number;
  currency?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
  checkoutSessionId?: string;
};

export type InitPosSpiQrPaymentResult = {
  checkoutSessionId: string;
  qrPayload: string;
  spiTxId: string;
  amount: number;
  currency: string;
  expiresAt: string | null;
  transactionId: string;
};

type PrepareRpcResult = {
  checkout_session_id: string;
  payment_request_id: string;
  transaction_id: string;
  spi_account_number: string;
  spi_tx_id: string;
  amount: number;
  currency_code: string;
  country_code: string;
  expires_at: string | null;
};

@Injectable()
export class SpiPosService {
  private readonly logger = new Logger(SpiPosService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async initQrPayment(
    input: InitPosSpiQrPaymentInput,
  ): Promise<InitPosSpiQrPaymentResult> {
    const { data: prepared, error: prepareError } = await this.supabase.rpc(
      'prepare_pos_spi_payment' as never,
      {
        p_organization_id: input.organizationId,
        p_merchant_id: input.merchantId,
        p_amount: input.amount,
        p_currency_code: input.currency ?? 'XOF',
        p_product_id: input.productId ?? null,
        p_metadata: input.metadata ?? null,
        p_checkout_session_id: input.checkoutSessionId ?? null,
      } as never,
    );

    if (prepareError || !prepared) {
      this.logger.error(
        `prepare_pos_spi_payment failed: ${prepareError?.message}`,
      );
      throw new BadRequestException(
        prepareError?.message ?? 'Failed to prepare POS SPI payment',
      );
    }

    const prep = prepared as PrepareRpcResult;
    const checkoutSessionId = prep.checkout_session_id;
    const spiTxId = prep.spi_tx_id;
    const countryCode = normalizeUemoaCountryCode(prep.country_code);
    const dateLimiteReponse =
      prep.expires_at ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    try {
      const sdk = await this.spiClient.getSdk(input.organizationId);
      const spiAlias = await this.spiClient.getOrCreateMerchantShidAlias(
        input.organizationId,
        prep.spi_account_number,
      );

      const montantCentimes = toProviderAmount(prep.amount);
      const spiResponse = await sdk.demandesPaiement.create({
        comptePaye: prep.spi_account_number,
        payeurAlias: '',
        montant: montantCentimes,
        categorie: '500',
        motif: `Paiement POS - Transaction ${spiTxId}`,
        txId: spiTxId,
        dateLimiteReponse,
        confirmation: false,
      });

      const spiStatus = (spiResponse.statut ?? 'INITIE') as
        | 'INITIE'
        | 'ENVOYE'
        | 'IRREVOCABLE'
        | 'REJETE';

      const qrPayload = sdk.qr.payload({
        alias: spiAlias,
        countryCode,
        qrType: 'DYNAMIC',
        referenceLabel: spiTxId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25),
        amount: toProviderAmount(prep.amount),
      });

      const { error: finalizeError } = await this.supabase.rpc(
        'finalize_pos_spi_payment_initiated' as never,
        {
          p_checkout_session_id: checkoutSessionId,
          p_spi_tx_id: spiTxId,
          p_spi_payment_status: spiStatus,
          p_qr_payload: qrPayload,
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
        qrPayload,
        spiTxId,
        amount: prep.amount,
        currency: prep.currency_code,
        expiresAt: prep.expires_at,
        transactionId: prep.transaction_id,
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

      this.logger.error(`SPI POS initiation failed: ${message}`, error);
      throw new BadRequestException(message);
    }
  }

  async getPaymentStatus(organizationId: string, checkoutSessionId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_pos_spi_payment_status' as never,
      {
        p_organization_id: organizationId,
        p_checkout_session_id: checkoutSessionId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data as unknown as Record<string, unknown>;
  }
}
