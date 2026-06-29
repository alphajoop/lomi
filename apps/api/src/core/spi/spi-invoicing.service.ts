import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { SpiClientService } from './spi-client.service';
import { toProviderAmount } from './spi.utils';

export type InitInvoiceSpiRtpInput = {
  organizationId: string;
  invoiceId: string;
  payeurAlias?: string;
};

export type InitBulkInvoiceSpiRtpInput = {
  organizationId: string;
  invoiceIds: string[];
};

type PrepareInvoiceRpcResult = {
  already_initiated: boolean;
  invoice_id: string;
  organization_id: string;
  customer_id: string;
  payment_request_id: string;
  spi_tx_id: string;
  spi_account_number: string;
  amount: number;
  currency_code: string;
  payeur_alias: string;
  due_date: string | null;
  invoice_number: string | null;
};

@Injectable()
export class SpiInvoicingService {
  private readonly logger = new Logger(SpiInvoicingService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly spiClient: SpiClientService,
  ) {}

  async requestPayment(input: InitInvoiceSpiRtpInput) {
    const { data: prepared, error: prepareError } = await this.supabase.rpc(
      'prepare_invoice_spi_rtp' as never,
      {
        p_invoice_id: input.invoiceId,
        p_payeur_alias: input.payeurAlias ?? null,
      } as never,
    );

    if (prepareError || !prepared) {
      this.logger.error(
        `prepare_invoice_spi_rtp failed: ${prepareError?.message}`,
      );
      throw new BadRequestException(
        prepareError?.message ?? 'Failed to prepare invoice SPI RTP',
      );
    }

    const prep = prepared as PrepareInvoiceRpcResult;

    if (prep.already_initiated) {
      return {
        invoiceId: prep.invoice_id,
        paymentRequestId: prep.payment_request_id,
        spiTxId: prep.spi_tx_id,
        amount: prep.amount,
        currency: prep.currency_code,
        alreadyInitiated: true,
      };
    }

    const dateLimitePaiement = prep.due_date
      ? new Date(prep.due_date).toISOString()
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const dateLimiteReponse = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const invoiceRef =
      prep.invoice_number ?? prep.invoice_id.substring(0, 8).toUpperCase();

    try {
      const spiResponse = await this.spiClient.executeWithSdk(
        input.organizationId,
        (sdk) =>
          sdk.demandesPaiement.create({
            comptePaye: prep.spi_account_number,
            payeurAlias: prep.payeur_alias,
            montant: toProviderAmount(prep.amount),
            categorie: '401',
            motif: `Facture ${invoiceRef}`,
            txId: prep.spi_tx_id,
            dateLimiteReponse,
            dateLimitePaiement,
            refDocType: 'INVC',
            refDocNumero: invoiceRef,
            confirmation: false,
          }),
      );

      const spiStatus = spiResponse.statut === 'REJETE' ? 'REJETE' : 'ENVOYE';

      await this.supabase.rpc(
        'finalize_invoice_spi_rtp_initiated' as never,
        {
          p_payment_request_id: prep.payment_request_id,
          p_spi_payment_status: spiStatus,
          p_metadata: {
            spi_response: spiResponse,
            date_limite_reponse:
              spiResponse.dateLimiteReponse ?? dateLimiteReponse,
          },
        } as never,
      );

      if (spiStatus === 'REJETE') {
        throw new BadRequestException('SPI rejected invoice payment request');
      }

      return {
        invoiceId: prep.invoice_id,
        paymentRequestId: prep.payment_request_id,
        spiTxId: prep.spi_tx_id,
        amount: prep.amount,
        currency: prep.currency_code,
        alreadyInitiated: false,
        dateLimiteReponse: spiResponse.dateLimiteReponse ?? dateLimiteReponse,
      };
    } catch (error) {
      await this.supabase.rpc(
        'finalize_invoice_spi_rtp_initiated' as never,
        {
          p_payment_request_id: prep.payment_request_id,
          p_spi_payment_status: 'REJETE',
          p_metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        } as never,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Invoice SPI RTP SDK error', error);
      throw new InternalServerErrorException(
        'Failed to send invoice payment request via SPI',
      );
    }
  }

  async bulkRequestPayment(input: InitBulkInvoiceSpiRtpInput) {
    if (!input.invoiceIds.length) {
      throw new BadRequestException('At least one invoice is required');
    }

    const preparedRows: PrepareInvoiceRpcResult[] = [];

    for (const invoiceId of input.invoiceIds) {
      const { data: prepared, error } = await this.supabase.rpc(
        'prepare_invoice_spi_rtp' as never,
        { p_invoice_id: invoiceId, p_payeur_alias: null } as never,
      );

      if (error || !prepared) {
        throw new BadRequestException(
          error?.message ?? `Failed to prepare invoice ${invoiceId}`,
        );
      }

      const prep = prepared as PrepareInvoiceRpcResult;
      if (prep.organization_id !== input.organizationId) {
        throw new BadRequestException('Invoice organization mismatch');
      }

      if (!prep.already_initiated) {
        preparedRows.push(prep);
      }
    }

    if (preparedRows.length === 0) {
      return {
        instructionId: null,
        processed: 0,
        alreadyInitiated: input.invoiceIds.length,
      };
    }

    const comptePaye = preparedRows[0]!.spi_account_number;
    const transactions = preparedRows.map((row) => {
      const invoiceRef =
        row.invoice_number ?? row.invoice_id.substring(0, 8).toUpperCase();
      return {
        txId: row.spi_tx_id,
        payeurAlias: row.payeur_alias,
        montant: toProviderAmount(row.amount),
        motif: `Facture ${invoiceRef}`,
        categorie: '401',
        dateLimitePaiement: row.due_date
          ? new Date(row.due_date).toISOString()
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        refDocType: 'INVC',
        refDocNumero: invoiceRef,
      };
    });

    try {
      const bulkResponse = await this.spiClient.executeWithSdk(
        input.organizationId,
        (sdk) =>
          sdk.demandesPaiementEnMasse.create({
            comptePaye,
            transactions,
            confirmation: false,
          }),
      );

      for (const row of preparedRows) {
        await this.supabase.rpc(
          'finalize_invoice_spi_rtp_initiated' as never,
          {
            p_payment_request_id: row.payment_request_id,
            p_spi_payment_status: 'ENVOYE',
            p_metadata: { bulk_response: bulkResponse },
          } as never,
        );
      }

      const instructionId =
        (bulkResponse as { instructionId?: string; id?: string })
          .instructionId ??
        (bulkResponse as { id?: string }).id ??
        null;

      return {
        instructionId,
        processed: preparedRows.length,
        alreadyInitiated: input.invoiceIds.length - preparedRows.length,
      };
    } catch (error) {
      for (const row of preparedRows) {
        await this.supabase.rpc(
          'finalize_invoice_spi_rtp_initiated' as never,
          {
            p_payment_request_id: row.payment_request_id,
            p_spi_payment_status: 'REJETE',
            p_metadata: {
              error: error instanceof Error ? error.message : String(error),
            },
          } as never,
        );
      }

      this.logger.error('Bulk invoice SPI RTP SDK error', error);
      throw new InternalServerErrorException(
        'Failed to send bulk invoice payment requests via SPI',
      );
    }
  }

  async getPaymentStatus(organizationId: string, invoiceId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_invoice_spi_payment_status' as never,
      {
        p_organization_id: organizationId,
        p_invoice_id: invoiceId,
      } as never,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
