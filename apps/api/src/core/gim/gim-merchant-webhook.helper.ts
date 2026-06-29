import { Logger } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { WebhookSenderService } from '../../webhooks/webhook-sender.service';
import { sanitizeMerchantWebhookTransactionPayload } from '../../webhooks/sanitize-merchant-webhook-transaction-payload';
import { maybeNotifySubscriptionRenewed } from '../../webhooks/subscription-webhook.helper';
import type { WebhookEvent } from '../../utils/types/api';

export async function dispatchGimMerchantWebhook(
  deps: {
    supabase: SupabaseService;
    webhookSender: WebhookSenderService;
    logger: Logger;
  },
  params: {
    transactionId: string;
    organizationId: string;
    event: WebhookEvent;
  },
): Promise<void> {
  const { supabase, webhookSender, logger } = deps;
  const { transactionId, organizationId, event } = params;

  try {
    const { data: txnRows, error: txnError } = await supabase.rpc(
      'get_transaction' as never,
      {
        p_transaction_id: transactionId,
        p_organization_id: organizationId,
      } as never,
    );

    const txnData = Array.isArray(txnRows) ? txnRows[0] : txnRows;
    if (txnError || !txnData) {
      logger.error({
        message: 'gim_webhook_fetch_transaction_failed',
        error: txnError?.message,
        transactionId,
      });
      return;
    }

    const transactionData = txnData as Record<string, unknown>;

    await maybeNotifySubscriptionRenewed(
      supabase,
      webhookSender,
      organizationId,
      transactionData,
      event,
      logger,
    );

    sanitizeMerchantWebhookTransactionPayload(transactionData);

    await webhookSender.notifyOrganization(
      organizationId,
      event,
      transactionData,
    );
  } catch (error) {
    logger.error({
      message: 'gim_merchant_webhook_dispatch_failed',
      error: error instanceof Error ? error.message : String(error),
      transactionId,
    });
  }
}
