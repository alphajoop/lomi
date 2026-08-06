import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiClientService } from './spi-client.service';
import { toProviderAmount } from './spi.utils';
import {
  extractSpiRejectionCode,
  mapSpiBnplRejection,
} from './spi-bnpl-rejection.util';

type PrepareBnplInstallment = {
  organization_id: string;
  payment_request_id: string;
  plan_id: string;
  installment_id: string;
  sequence_number: number;
  spi_tx_id: string;
  amount: number;
  currency_code: string;
  spi_account_number: string;
  date_limite_paiement: string;
  interest_amount?: number;
  country_code?: string;
  already_initiated: boolean;
};

export type SubmitBnplInstallmentResult = {
  paymentRequestId: string;
  spiTxId: string;
  spiStatus: string;
  alreadyInitiated: boolean;
};

/** Builds OpenAPI-aligned remise for e-commerce deferred debit (category 521). */
const buildBnplRemise = (interestAmount: number | undefined) => {
  const interestCentimes = toProviderAmount(Number(interestAmount ?? 0));
  if (interestCentimes > 0) {
    return { montant: interestCentimes };
  }
  return { taux: 1 };
};

/**
 * Submits SPI deferred-debit RTPs for BNPL installment schedules.
 */
@Injectable()
export class SpiBnplService {
  private readonly logger = new Logger(SpiBnplService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async submitInstallmentRtp(
    paymentRequestId: string,
    payeurAlias: string,
  ): Promise<SubmitBnplInstallmentResult> {
    const alias = payeurAlias?.trim();
    if (!alias) {
      throw new BadRequestException('payeurAlias is required');
    }

    const { data: prepared, error: prepareError } = await this.supabase.rpc(
      'prepare_bnpl_installment_spi' as never,
      { p_payment_request_id: paymentRequestId } as never,
    );

    if (prepareError || !prepared) {
      this.logger.error(
        `prepare_bnpl_installment_spi failed: ${prepareError?.message}`,
      );
      throw new BadRequestException(
        prepareError?.message ?? 'Failed to prepare BNPL installment',
      );
    }

    const prep = prepared as PrepareBnplInstallment;

    if (prep.already_initiated) {
      return {
        paymentRequestId: prep.payment_request_id,
        spiTxId: prep.spi_tx_id,
        spiStatus: 'ENVOYE',
        alreadyInitiated: true,
      };
    }

    const dateLimitePaiement =
      prep.date_limite_paiement ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateLimiteReponse = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    try {
      const montantCentimes = toProviderAmount(prep.amount);
      const remise = buildBnplRemise(prep.interest_amount);

      const spiResponse = (await this.spiClient.executeWithSdk(
        prep.organization_id,
        (sdk) =>
          sdk.demandesPaiement.create({
            comptePaye: prep.spi_account_number,
            payeurAlias: alias,
            montant: montantCentimes,
            categorie: '521',
            motif: `BNPL installment ${prep.sequence_number} - ${prep.spi_tx_id}`,
            txId: prep.spi_tx_id,
            dateLimiteReponse,
            dateLimitePaiement,
            debitDiffere: true,
            remise,
            refDocType: 'PUOR',
            refDocNumero: prep.spi_tx_id,
            confirmation: false,
          }),
      )) as { statut?: string; statutRaison?: string };

      const spiStatus = (spiResponse.statut ?? 'INITIE') as
        | 'INITIE'
        | 'ENVOYE'
        | 'IRREVOCABLE'
        | 'REJETE';

      if (spiStatus === 'REJETE') {
        const rejection = mapSpiBnplRejection(
          extractSpiRejectionCode(null, spiResponse),
        );
        await this.finalizeRejected(paymentRequestId, rejection.message);
        throw new BadRequestException(rejection);
      }

      const { error: finalizeError } = await this.supabase.rpc(
        'finalize_bnpl_installment_spi_initiated' as never,
        {
          p_payment_request_id: paymentRequestId,
          p_spi_payment_status: spiStatus,
          p_spi_init_success: true,
        } as never,
      );

      if (finalizeError) {
        throw new InternalServerErrorException(finalizeError.message);
      }

      return {
        paymentRequestId,
        spiTxId: prep.spi_tx_id,
        spiStatus,
        alreadyInitiated: false,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const rejectionCode = extractSpiRejectionCode(error);
      const rejection = mapSpiBnplRejection(rejectionCode);
      const message =
        rejectionCode != null ? rejection.message : (
          error instanceof Error
            ? error.message
            : 'BNPL SPI installment initiation failed'
        );

      await this.finalizeRejected(paymentRequestId, message);

      this.logger.error(`BNPL SPI submit failed: ${message}`, error);

      if (rejectionCode) {
        throw new BadRequestException(rejection);
      }

      throw new BadRequestException(message);
    }
  }

  async submitAllInstallmentsForPlan(
    paymentRequestIds: string[],
    payeurAlias: string,
  ): Promise<SubmitBnplInstallmentResult[]> {
    const results: SubmitBnplInstallmentResult[] = [];
    for (const requestId of paymentRequestIds) {
      results.push(await this.submitInstallmentRtp(requestId, payeurAlias));
    }
    return results;
  }

  private async finalizeRejected(
    paymentRequestId: string,
    message: string,
  ): Promise<void> {
    await this.supabase.rpc(
      'finalize_bnpl_installment_spi_initiated' as never,
      {
        p_payment_request_id: paymentRequestId,
        p_spi_payment_status: 'REJETE',
        p_spi_init_success: false,
        p_spi_error_message: message,
      } as never,
    );
  }
}
