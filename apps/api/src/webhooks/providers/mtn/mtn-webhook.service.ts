import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { WideEventService } from '../../../utils/telemetry/wide-event.service';
import { WebhookSenderService } from '../../webhook-sender.service';
import { sanitizeMerchantWebhookTransactionPayload } from '../../sanitize-merchant-webhook-transaction-payload';
import { maybeNotifySubscriptionRenewed } from '../../subscription-webhook.helper';
import { WebhookEvent } from '../../../utils/types/api';

type MtnCallbackPayload = {
  externalId?: string;
  financialTransactionId?: string;
  status?: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  amount?: string;
  currency?: string;
  reason?: { code?: string; message?: string } | string;
};

type MtnTransactionLookup = {
  transaction_id: string;
  merchant_id?: string | null;
  organization_id: string;
};

@Injectable()
export class MtnWebhookService {
  private readonly logger = new Logger(MtnWebhookService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly webhookSender: WebhookSenderService,
    private readonly wideEvent: WideEventService,
  ) {}

  async handleWebhook(headers: Record<string, string>, body: unknown) {
    const payload = this.parsePayload(body);
    const referenceId =
      headers['x-reference-id'] ||
      headers['X-Reference-Id'] ||
      payload.externalId;

    if (!payload.status) {
      throw new BadRequestException('Missing MTN payment status');
    }

    if (payload.status === 'PENDING') {
      return { received: true, ignored: true, status: payload.status };
    }

    if (payload.status !== 'SUCCESSFUL' && payload.status !== 'FAILED') {
      throw new BadRequestException(
        `Unsupported MTN status: ${payload.status}`,
      );
    }

    const dedupeKey = `${payload.externalId ?? referenceId ?? 'unknown'}:${payload.status}:${payload.financialTransactionId ?? ''}`;
    const { data: claimed, error: claimError } = await this.supabase.rpc(
      'claim_inbound_provider_webhook_event',
      {
        p_provider: 'MTN',
        p_provider_event_id: dedupeKey,
        p_metadata: {
          status: payload.status,
          external_id: payload.externalId,
        } as any,
      },
    );

    if (claimError) {
      this.logger.warn(
        `MTN inbound idempotency claim error: ${claimError.message}`,
      );
    } else if (claimed === false) {
      this.logger.log({
        message: 'mtn_webhook_duplicate',
        dedupe_key: dedupeKey,
      });
      return { received: true, duplicate: true };
    }

    const transaction = await this.resolveTransaction(payload, referenceId);
    if (!transaction) {
      this.logger.error('MTN webhook: transaction not found', {
        externalId: payload.externalId,
        referenceId,
      });
      throw new BadRequestException('Transaction not found for MTN callback');
    }

    const terminalStatus =
      payload.status === 'SUCCESSFUL' ? 'completed' : 'failed';
    const reasonMessage =
      typeof payload.reason === 'string'
        ? payload.reason
        : payload.reason?.message;
    const reasonCode =
      typeof payload.reason === 'string' ? undefined : payload.reason?.code;

    const metadata = {
      mtn_external_id: payload.externalId,
      mtn_reference_id: referenceId,
      mtn_financial_transaction_id: payload.financialTransactionId,
      mtn_status: payload.status,
      ...(reasonMessage ? { mtn_failure_reason: reasonMessage } : {}),
      ...(reasonCode ? { mtn_failure_code: reasonCode } : {}),
    };

    await this.updateTransactionStatus(
      transaction.transaction_id,
      terminalStatus,
      metadata,
    );

    if (terminalStatus === 'completed') {
      this.wideEvent.logEvent({
        eventName: 'mtn_payment_completed',
        organizationId: transaction.organization_id,
        attributes: {
          'payment.transaction_id': transaction.transaction_id,
          'payment.amount': payload.amount,
          'payment.currency': payload.currency,
          'payment.provider': 'MTN',
          'telemetry.source_layer': 'api:webhook',
        },
      });

      await this.triggerMerchantWebhook(
        transaction.transaction_id,
        transaction.organization_id,
        'PAYMENT_SUCCEEDED',
      );
    } else {
      await this.triggerMerchantWebhook(
        transaction.transaction_id,
        transaction.organization_id,
        'PAYMENT_FAILED',
      );
    }

    return {
      received: true,
      transaction_id: transaction.transaction_id,
      status: payload.status,
    };
  }

  private parsePayload(body: unknown): MtnCallbackPayload {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid MTN webhook payload');
    }
    return body as MtnCallbackPayload;
  }

  private async resolveTransaction(
    payload: MtnCallbackPayload,
    referenceId?: string,
  ): Promise<MtnTransactionLookup | null> {
    if (payload.externalId) {
      const { data, error } = await (this.supabase.getClient() as any).rpc(
        'get_mtn_transaction_by_external_id',
        { p_external_id: payload.externalId },
      );
      if (error) {
        this.logger.error('MTN externalId lookup failed:', error);
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.transaction_id) {
        return row as MtnTransactionLookup;
      }
    }

    if (referenceId) {
      const { data, error } = await (this.supabase.getClient() as any).rpc(
        'get_mtn_transaction_by_reference_id',
        { p_reference_id: referenceId },
      );
      if (error) {
        this.logger.error('MTN referenceId lookup failed:', error);
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.transaction_id) {
        return row as MtnTransactionLookup;
      }
    }

    return null;
  }

  private async updateTransactionStatus(
    transactionId: string,
    status: string,
    metadata: Record<string, unknown>,
  ) {
    const { error } = await (this.supabase.getClient() as any).rpc(
      'update_transaction_status',
      {
        p_transaction_id: transactionId,
        p_status: status,
        p_metadata: metadata,
      },
    );

    if (error) {
      this.logger.error('Error updating MTN transaction status:', error);
      throw new Error('Failed to update transaction status');
    }
  }

  private async triggerMerchantWebhook(
    transactionId: string,
    organizationId: string,
    event: WebhookEvent,
  ) {
    try {
      const { data: txnRows, error: txnError } = await this.supabase
        .getClient()
        .rpc(
          'get_transaction' as any,
          {
            p_transaction_id: transactionId,
            p_organization_id: organizationId,
          } as any,
        );

      const txnData = Array.isArray(txnRows) ? txnRows[0] : txnRows;
      if (txnError || !txnData) {
        this.logger.error(
          'Failed to fetch transaction for MTN webhook:',
          txnError,
        );
        return;
      }

      const transactionData = txnData as Record<string, unknown>;

      await maybeNotifySubscriptionRenewed(
        this.supabase,
        this.webhookSender,
        organizationId,
        transactionData,
        event,
        this.logger,
      );

      sanitizeMerchantWebhookTransactionPayload(transactionData);

      await this.webhookSender.notifyOrganization(
        organizationId,
        event,
        transactionData,
      );
    } catch (error) {
      this.logger.error('Error triggering merchant webhook for MTN:', error);
    }
  }
}
