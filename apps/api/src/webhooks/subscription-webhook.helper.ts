import { Logger } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { WebhookSenderService } from './webhook-sender.service';
import { WebhookEvent } from '../utils/types/api';

const RENEWAL_PAYMENT_FLOWS = new Set([
  'subscription_renewal',
  'subscription_renewal_checkout',
]);

function readPaymentFlow(txnData: Record<string, unknown>): string | undefined {
  const metadata = txnData.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }
  const flow = (metadata as Record<string, unknown>).payment_flow;
  return typeof flow === 'string' ? flow : undefined;
}

function readSubscriptionId(
  txnData: Record<string, unknown>,
): string | undefined {
  const id = txnData.subscription_id ?? txnData.subscriptionId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

function readTransactionId(txnData: Record<string, unknown>): string | null {
  const id = txnData.transaction_id ?? txnData.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * Optional API-side fallback when DB → edge subscription webhook delivery fails.
 * Gated by WEBHOOK_SUBSCRIPTION_RENEWAL_API_FALLBACK=true.
 * Call before sanitizeMerchantWebhookTransactionPayload (payment_flow lives in metadata).
 */
export async function maybeNotifySubscriptionRenewed(
  supabase: SupabaseService,
  webhookSender: WebhookSenderService,
  organizationId: string,
  txnData: Record<string, unknown>,
  event: string,
  logger?: Logger,
): Promise<void> {
  if (event !== 'PAYMENT_SUCCEEDED') {
    return;
  }

  if (process.env.WEBHOOK_SUBSCRIPTION_RENEWAL_API_FALLBACK !== 'true') {
    return;
  }

  const subscriptionId = readSubscriptionId(txnData);
  const paymentFlow = readPaymentFlow(txnData);

  if (
    !subscriptionId ||
    !paymentFlow ||
    !RENEWAL_PAYMENT_FLOWS.has(paymentFlow)
  ) {
    return;
  }

  try {
    const { data, error } = await supabase.getClient().rpc(
      'build_merchant_subscription_webhook_payload' as never,
      {
        p_subscription_id: subscriptionId,
        p_transaction_id: readTransactionId(txnData),
      } as never,
    );

    if (error || !data) {
      logger?.warn(
        `Failed to build subscription renewal webhook payload: ${error?.message ?? 'no data'}`,
      );
      return;
    }

    await webhookSender.notifyOrganization(
      organizationId,
      'SUBSCRIPTION_RENEWED' as WebhookEvent,
      data as Record<string, unknown>,
    );

    logger?.log(
      `API fallback emitted SUBSCRIPTION_RENEWED for subscription ${subscriptionId}`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.warn(`Subscription renewal API fallback failed: ${message}`);
  }
}
