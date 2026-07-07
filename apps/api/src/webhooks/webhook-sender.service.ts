import { Injectable, Logger, Optional } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import * as crypto from 'crypto';
import { WebhookEvent } from '../utils/types/api';
import { resolveMerchantWebhookRelayEnvironment } from '../utils/payment-environment';
import { Queue } from 'bullmq';
import {
  deliverMerchantWebhook,
  UnsafeWebhookUrlError,
} from './merchant-webhook-url';
import { CliListenerService } from '../cli/cli-listener.service';
import { CliStreamService } from '../cli/cli-stream.service';
import { sanitizeMerchantWebhookTransactionPayload } from './sanitize-merchant-webhook-transaction-payload';
import { safeBullJobId } from '../utils/bullmq/job-id';
import { logStructured } from '../utils/logging/structured-console-logger';

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  organization_id: string;
}

export interface WebhookDeliveryContext {
  dispatchId?: string;
  outboxId?: string;
  /** 1-based Bull attempt (job.attemptsMade + 1) */
  attemptNumber?: number;
  merchantId?: string;
}

export interface WebhookSendResult {
  success: boolean;
  /** When false and shouldRetry is true, Bull should retry. */
  shouldRetry: boolean;
  lastResponseStatus?: number;
  lastResponseBody?: unknown;
  deadLetterReason?: string;
  /** Sync path: inactive / not subscribed without a dispatch row. */
  inactiveOrUnsubscribed?: boolean;
}

@Injectable()
export class WebhookSenderService {
  private readonly logger = new Logger(WebhookSenderService.name);

  /** ~2s base exponential backoff: retries land within ~1–2 min for transient failures. */
  private static readonly WEBHOOK_QUEUE_JOB_OPTS = {
    attempts: 6,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
  };

  constructor(
    private readonly supabase: SupabaseService,
    @Optional() private readonly cliListener?: CliListenerService,
    @Optional() private readonly cliStream?: CliStreamService,
  ) {}

  /**
   * Outbox delivery is on by default. Set WEBHOOK_OUTBOX_ENABLED=false to disable.
   * WEBHOOK_OUTBOX_CANARY_ORG_IDS limits rollout when WEBHOOK_OUTBOX_ENABLED is not true|false.
   */
  isWebhookOutboxEnabled(organizationId: string): boolean {
    if (process.env.WEBHOOK_OUTBOX_ENABLED === 'false') {
      return false;
    }
    if (process.env.WEBHOOK_OUTBOX_ENABLED === 'true') {
      return true;
    }
    const raw = process.env.WEBHOOK_OUTBOX_CANARY_ORG_IDS;
    if (raw?.trim()) {
      const ids = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return ids.includes(organizationId);
    }
    return true;
  }

  /**
   * Prepares the webhook payload based on the event type and data
   */
  prepareWebhookPayload(
    event: WebhookEvent,
    data: any,
    stablePayloadId?: string,
  ): any {
    const timestamp = new Date().toISOString();

    return {
      id: stablePayloadId ?? crypto.randomUUID(),
      event,
      timestamp,
      data,
      lomi_environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Generates a signature for the webhook payload using the webhook secret
   */
  generateSignature(payloadString: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Re-deliver a stored webhook envelope (manual retry from delivery logs).
   * Sends the exact payload JSON so event id and signature stay stable.
   */
  async sendStoredWebhookPayload(
    webhook: Webhook,
    storedPayload: {
      id?: string;
      event: WebhookEvent;
      timestamp?: string;
      data: Record<string, unknown>;
      lomi_environment?: string;
    },
    context?: Pick<WebhookDeliveryContext, 'attemptNumber' | 'merchantId'>,
  ): Promise<WebhookSendResult> {
    const event = storedPayload.event;
    if (!webhook.active || !webhook.events.includes(event)) {
      return {
        success: false,
        shouldRetry: false,
        inactiveOrUnsubscribed: true,
      };
    }

    const payloadString = JSON.stringify(storedPayload);
    const signature = this.generateSignature(payloadString, webhook.secret);

    try {
      const delivery = await deliverMerchantWebhook(
        webhook.url,
        payloadString,
        {
          'Content-Type': 'application/json',
          'X-Lomi-Signature': signature,
          'X-Lomi-Event': event,
          'User-Agent': 'Lomi-Webhook/1.0',
        },
      );

      if (delivery.usedAlternateHost) {
        this.logger.log(
          `Webhook ${webhook.id} delivered via www/apex fallback to ${delivery.deliveredUrl}`,
        );
      }

      if (delivery.status >= 200 && delivery.status < 300) {
        await this.logDelivery(
          webhook.id,
          delivery.status,
          delivery.data,
          storedPayload,
          context?.attemptNumber ?? 1,
          context?.merchantId,
        );
        return {
          success: true,
          shouldRetry: false,
          lastResponseStatus: delivery.status,
          lastResponseBody: delivery.data,
        };
      }

      return {
        success: false,
        shouldRetry: delivery.status < 400 || delivery.status >= 500,
        lastResponseStatus: delivery.status,
        lastResponseBody: delivery.data,
        deadLetterReason:
          delivery.status >= 400 && delivery.status < 500
            ? 'client_error_http'
            : 'server_error_http',
      };
    } catch (error: any) {
      const status = error.response?.status as number | undefined;
      const respBody = error.response?.data ?? error.message;
      const message =
        error instanceof UnsafeWebhookUrlError
          ? error.message
          : typeof respBody === 'string'
            ? respBody
            : 'Webhook URL failed outbound safety checks';
      return {
        success: false,
        shouldRetry: status == null || status >= 500,
        lastResponseStatus: status,
        lastResponseBody: message,
        deadLetterReason:
          error instanceof UnsafeWebhookUrlError
            ? 'blocked_webhook_url'
            : status != null && status >= 400 && status < 500
              ? 'client_error_http'
              : 'network_or_server',
      };
    }
  }

  /**
   * Single HTTP attempt. BullMQ is the sole retry authority when dispatchId is set.
   */
  async sendWebhookWithContext(
    webhook: Webhook,
    event: WebhookEvent,
    data: any,
    context?: WebhookDeliveryContext,
  ): Promise<WebhookSendResult> {
    this.logger.log({
      message: 'Attempting to send webhook',
      webhookId: webhook.id,
      event,
      url: webhook.url,
      dispatchId: context?.dispatchId,
      attempt: context?.attemptNumber,
    });

    const stablePayloadId = context?.outboxId;

    if (!webhook.active || !webhook.events.includes(event)) {
      this.logger.log(
        `Webhook ${webhook.id} inactive or not subscribed to ${event}`,
      );
      if (context?.dispatchId) {
        await this.supabase.rpc('mark_webhook_dispatch_dead_letter', {
          p_dispatch_id: context.dispatchId,
          p_reason: 'webhook_inactive_or_unsubscribed',
        });
        return {
          success: true,
          shouldRetry: false,
        };
      }
      return {
        success: false,
        shouldRetry: false,
        inactiveOrUnsubscribed: true,
      };
    }

    const payload = this.prepareWebhookPayload(event, data, stablePayloadId);
    const payloadString = JSON.stringify(payload);
    const signature = this.generateSignature(payloadString, webhook.secret);

    await this.maybePublishCliStream(
      webhook.organization_id,
      event,
      payloadString,
      signature,
      payload,
    );

    const started = Date.now();

    try {
      const delivery = await deliverMerchantWebhook(
        webhook.url,
        payloadString,
        {
          'Content-Type': 'application/json',
          'X-Lomi-Signature': signature,
          'X-Lomi-Event': event,
          'User-Agent': 'Lomi-Webhook/1.0',
        },
      );

      const durationMs = Date.now() - started;

      if (delivery.usedAlternateHost) {
        this.logger.log(
          `Webhook ${webhook.id} delivered via www/apex fallback to ${delivery.deliveredUrl}`,
        );
      }

      if (context?.dispatchId && context.attemptNumber != null) {
        await this.supabase.rpc('record_webhook_delivery_attempt', {
          p_dispatch_id: context.dispatchId,
          p_attempt_number: context.attemptNumber,
          p_response_status: delivery.status,
          p_response_body:
            typeof delivery.data === 'string'
              ? delivery.data
              : JSON.stringify(delivery.data),
          p_error_message: '',
          p_request_duration_ms: durationMs,
        });
      }

      if (delivery.status >= 200 && delivery.status < 300) {
        await this.logDelivery(
          webhook.id,
          delivery.status,
          delivery.data,
          payload,
          context?.attemptNumber ?? 1,
          context?.merchantId,
        );

        if (context?.dispatchId) {
          await this.supabase.rpc('mark_webhook_dispatch_delivered', {
            p_dispatch_id: context.dispatchId,
          });
        }

        this.logger.log(`Webhook ${webhook.id} delivered successfully`);
        return {
          success: true,
          shouldRetry: false,
          lastResponseStatus: delivery.status,
          lastResponseBody: delivery.data,
        };
      }

      const bodyPreview =
        typeof delivery.data === 'string'
          ? delivery.data
          : JSON.stringify(delivery.data);

      if (context?.dispatchId && context.attemptNumber != null) {
        await this.supabase.rpc('record_webhook_delivery_attempt', {
          p_dispatch_id: context.dispatchId,
          p_attempt_number: context.attemptNumber,
          p_response_status: delivery.status,
          p_response_body: bodyPreview,
          p_error_message: `non_success_status_${delivery.status}`,
          p_request_duration_ms: durationMs,
        });
      }

      const clientErr = delivery.status >= 400 && delivery.status < 500;
      if (clientErr && delivery.status === 404) {
        this.logger.warn(
          `Webhook ${webhook.id} returned 404 for URL ${webhook.url} (org ${webhook.organization_id}) — endpoint not found; verify registered webhook URL`,
        );
      }
      return {
        success: false,
        shouldRetry: !clientErr,
        lastResponseStatus: delivery.status,
        lastResponseBody: delivery.data,
        deadLetterReason: clientErr ? 'client_error_http' : 'server_error_http',
      };
    } catch (error: any) {
      const durationMs = Date.now() - started;
      const status = error.response?.status as number | undefined;
      const respBody = error.response?.data ?? error.message;
      const blockedUrl = error instanceof UnsafeWebhookUrlError;
      const message = blockedUrl
        ? error.message
        : typeof respBody === 'string'
          ? respBody
          : 'request_failed';

      if (blockedUrl) {
        this.logger.warn(
          `Blocked webhook delivery for ${webhook.id}: ${message}`,
        );
      }

      if (context?.dispatchId && context.attemptNumber != null) {
        await this.supabase.rpc('record_webhook_delivery_attempt', {
          p_dispatch_id: context.dispatchId,
          p_attempt_number: context.attemptNumber,
          p_response_status: status ?? 0,
          p_response_body: message,
          p_error_message: blockedUrl
            ? 'blocked_webhook_url'
            : (error.message ?? 'request_failed'),
          p_request_duration_ms: durationMs,
        });

        if (blockedUrl) {
          await this.supabase.rpc('mark_webhook_dispatch_dead_letter', {
            p_dispatch_id: context.dispatchId,
            p_reason: 'blocked_webhook_url',
          });
        }
      }

      if (!blockedUrl) {
        this.logger.warn(
          `Webhook delivery failed (single attempt): ${error.message}`,
        );
      }

      const clientErr = status != null && status >= 400 && status < 500;
      return {
        success: false,
        shouldRetry: !blockedUrl && !clientErr,
        lastResponseStatus: status,
        lastResponseBody: message,
        deadLetterReason: blockedUrl
          ? 'blocked_webhook_url'
          : clientErr
            ? 'client_error_http'
            : 'network_or_server',
      };
    }
  }

  /**
   * Backwards-compatible: one or more internal attempts (no outbox / no Bull).
   */
  async sendWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    data: any,
    maxRetries = 3,
    retryDelay = 3000,
  ): Promise<boolean> {
    let retries = 0;
    let last: WebhookSendResult | undefined;
    while (retries <= maxRetries) {
      const r = await this.sendWebhookWithContext(webhook, event, data);
      last = r;
      if (r.success) {
        return true;
      }
      if (r.inactiveOrUnsubscribed) {
        return false;
      }
      if (!r.shouldRetry) {
        await this.logDelivery(
          webhook.id,
          r.lastResponseStatus ?? 0,
          r.lastResponseBody,
          this.prepareWebhookPayload(event, data),
          retries + 1,
        );
        return false;
      }
      retries++;
      if (retries <= maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, retries - 1)),
        );
      }
    }

    await this.logDelivery(
      webhook.id,
      last?.lastResponseStatus ?? 0,
      last?.lastResponseBody ?? 'exhausted_local_retries',
      this.prepareWebhookPayload(event, data),
      maxRetries + 1,
    );

    this.logger.error(
      `Webhook ${webhook.id} delivery failed after ${maxRetries} local retries`,
    );
    logStructured({
      event: 'webhook_delivery_exhausted_retries',
      message: `Webhook ${webhook.id} delivery failed after ${maxRetries} local retries`,
      webhook_id: webhook.id,
    });
    return false;
  }

  private async logDelivery(
    webhookId: string,
    status: number,
    responseBody: any,
    payload: any,
    attemptNumber: number,
    merchantId?: string,
  ) {
    try {
      const { error } = await this.supabase.rpc('log_webhook_delivery', {
        p_webhook_id: webhookId,
        p_merchant_id:
          merchantId ??
          payload.data?.merchant_id ??
          payload.data?.organization_id,
        p_organization_id: payload.data?.organization_id,
        p_event_type: payload.event,
        p_payload: payload,
        p_response_status: status,
        p_response_body:
          typeof responseBody === 'string'
            ? responseBody
            : JSON.stringify(responseBody),
        p_attempt_number: attemptNumber,
        p_headers: null,
        p_request_duration_ms: undefined,
      });

      if (error) {
        this.logger.error(`Failed to log webhook delivery: ${error.message}`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to log webhook delivery: ${err.message}`);
    }
  }

  /**
   * Loads pending dispatches for an outbox row (SQL path) and enqueues BullMQ jobs.
   */
  async queuePendingOutboxDispatches(outboxId: string, queue: Queue) {
    const { data: rows, error } = await this.supabase.rpc(
      'fetch_pending_webhook_outbox_jobs',
      { p_outbox_id: outboxId },
    );

    if (error) {
      this.logger.error(
        `queuePendingOutboxDispatches: RPC failed for ${outboxId}: ${error.message}`,
      );
      return { queued: 0, error: error.message };
    }

    const jobs = rows ?? [];

    if (jobs.length === 0) {
      this.logger.warn(
        `queuePendingOutboxDispatches: outbox ${outboxId} not found or no pending dispatches`,
      );
      return {
        queued: 0,
        error: 'outbox not found or no pending dispatches',
      };
    }

    const first = jobs[0]!;
    const event = first.event_type as WebhookEvent;
    const data = first.payload as Record<string, unknown>;
    const merchantId = first.merchant_id;

    if (event === 'PAYMENT_SUCCEEDED' || event === 'PAYMENT_FAILED') {
      sanitizeMerchantWebhookTransactionPayload(data);
    }

    if (!merchantId) {
      this.logger.error(
        `queuePendingOutboxDispatches: no merchant for org ${first.organization_id}`,
      );
      return { queued: 0, error: 'no merchant' };
    }

    let queued = 0;

    for (const row of jobs) {
      if (!row.is_active) {
        continue;
      }

      const webhook: Webhook = {
        id: row.webhook_id,
        url: row.url,
        events: row.authorized_events as WebhookEvent[],
        secret: row.verification_token,
        active: row.is_active,
        organization_id: row.webhook_organization_id,
      };

      if (!webhook.events.includes(event)) {
        continue;
      }

      const jobId = safeBullJobId(`wh-dispatch:${row.dispatch_id}`);

      try {
        await queue.add(
          'send-webhook',
          {
            webhook,
            event,
            data,
            dispatchId: row.dispatch_id,
            outboxId: first.outbox_id,
            merchantId: row.created_by ?? merchantId,
          },
          {
            jobId,
            ...WebhookSenderService.WEBHOOK_QUEUE_JOB_OPTS,
          },
        );
        queued += 1;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Queue add skipped for ${jobId}: ${message}`);
      }
    }

    this.logger.log(
      `Queued ${queued} webhook job(s) for outbox ${outboxId} (${event})`,
    );

    return { queued, outbox_id: first.outbox_id, event };
  }

  async queueWebhooksForOrganization(
    organizationId: string,
    event: WebhookEvent,
    data: any,
    queue: Queue,
  ) {
    const { data: merchantId, error: merchantError } = await this.supabase.rpc(
      'get_merchant_from_organization',
      {
        p_organization_id: organizationId,
      },
    );

    if (merchantError || !merchantId) {
      this.logger.error(
        `Failed to get merchant for org ${organizationId}: ${merchantError?.message || 'No merchant found'}`,
      );
      return;
    }

    const relayEnv = resolveMerchantWebhookRelayEnvironment(data);

    const { data: webhooks, error } = await this.supabase.rpc(
      'fetch_organization_webhooks',
      {
        p_merchant_id: merchantId,
        p_organization_id: organizationId,
        p_event: event,
        p_is_active: true,
        p_search_term: null,
        p_environment: relayEnv,
      },
    );

    if (error) {
      this.logger.error(
        `Failed to fetch webhooks for org ${organizationId}: ${error.message}`,
      );
      return;
    }

    const webhooksArray = (webhooks as any[]) || [];
    if (webhooksArray.length === 0) {
      this.logger.log(
        `No webhooks found for org ${organizationId} subscribed to event ${event}`,
      );
      return;
    }

    const relevantWebhooks = webhooksArray
      .map((w: any) => ({
        id: w.webhook_id,
        url: w.url,
        events: w.authorized_events as WebhookEvent[],
        secret: w.verification_token,
        active: w.is_active,
        organization_id: w.organization_id,
      }))
      .filter((w) => w.events.includes(event));

    if (relevantWebhooks.length === 0) {
      return;
    }

    const useOutbox = this.isWebhookOutboxEnabled(organizationId);
    const idempotencyKey =
      data?.id != null && String(data.id).length > 0
        ? `${event}:${String(data.id)}`
        : `${event}:${crypto.randomUUID()}`;

    let outboxId: string | undefined;

    if (useOutbox) {
      const { data: oid, error: obErr } = await this.supabase.rpc(
        'webhook_outbox_upsert_event',
        {
          p_organization_id: organizationId,
          p_event_type: event,
          p_idempotency_key: idempotencyKey,
          p_payload: data,
        },
      );
      if (obErr) {
        this.logger.error(
          `webhook_outbox_upsert_event failed: ${obErr.message}`,
        );
      } else if (oid) {
        outboxId = oid as string;
      }
    }

    for (const webhook of relevantWebhooks) {
      let dispatchId: string | undefined;

      if (useOutbox && outboxId) {
        const { data: did, error: dErr } = await this.supabase.rpc(
          'webhook_dispatch_ensure',
          {
            p_outbox_id: outboxId,
            p_webhook_id: webhook.id,
          },
        );
        if (dErr) {
          this.logger.error(`webhook_dispatch_ensure failed: ${dErr.message}`);
          continue;
        }
        dispatchId = did as string;
      }

      const jobId = safeBullJobId(
        dispatchId != null
          ? `wh-dispatch:${dispatchId}`
          : `wh-fallback:${webhook.id}:${idempotencyKey}:${crypto.randomUUID()}`,
      );

      try {
        await queue.add(
          'send-webhook',
          {
            webhook,
            event,
            data,
            dispatchId,
            outboxId,
            merchantId,
          },
          {
            jobId,
            ...WebhookSenderService.WEBHOOK_QUEUE_JOB_OPTS,
          },
        );
      } catch (e: any) {
        this.logger.warn(
          `Queue add skipped or duplicate jobId ${jobId}: ${e.message}`,
        );
      }
    }

    this.logger.log(
      `Queued ${relevantWebhooks.length} webhook jobs for org ${organizationId} (relayEnv=${relayEnv}, outbox=${useOutbox})`,
    );
  }

  async notifyOrganization(
    organizationId: string,
    event: WebhookEvent,
    data: any,
  ) {
    const { data: merchantId, error: merchantError } = await this.supabase.rpc(
      'get_merchant_from_organization',
      {
        p_organization_id: organizationId,
      },
    );

    if (merchantError || !merchantId) {
      this.logger.error(
        `Failed to get merchant for org ${organizationId}: ${merchantError?.message || 'No merchant found'}`,
      );
      return;
    }

    const relayEnv = resolveMerchantWebhookRelayEnvironment(data);

    const { data: webhooks, error } = await this.supabase.rpc(
      'fetch_organization_webhooks',
      {
        p_merchant_id: merchantId,
        p_organization_id: organizationId,
        p_event: event,
        p_is_active: true,
        p_search_term: null,
        p_environment: relayEnv,
      },
    );

    if (error) {
      this.logger.error(
        `Failed to fetch webhooks for org ${organizationId}: ${error.message}`,
      );
      return;
    }

    const webhooksArray = (webhooks as any[]) || [];
    if (webhooksArray.length === 0) {
      this.logger.log(
        `No webhooks found for org ${organizationId} subscribed to event ${event}`,
      );
      return;
    }

    const relevantWebhooks = webhooksArray
      .map((w: any) => ({
        id: w.webhook_id,
        url: w.url,
        events: w.authorized_events as WebhookEvent[],
        secret: w.verification_token,
        active: w.is_active,
        organization_id: w.organization_id,
      }))
      .filter((w) => w.events.includes(event));

    await Promise.allSettled(
      relevantWebhooks.map((w) => this.sendWebhook(w, event, data)),
    );
  }

  private async maybePublishCliStream(
    organizationId: string,
    event: WebhookEvent,
    payloadString: string,
    signature: string,
    _payload: unknown,
  ): Promise<void> {
    if (!this.cliListener || !this.cliStream) {
      return;
    }

    const listening = await this.cliListener.hasActiveListener(organizationId);
    if (!listening) {
      return;
    }

    this.cliStream.emit(organizationId, {
      type: 'webhook',
      event,
      headers: {
        'Content-Type': 'application/json',
        'X-Lomi-Signature': signature,
        'X-Lomi-Event': event,
        'User-Agent': 'Lomi-Webhook/1.0',
      },
      payload: JSON.parse(payloadString) as unknown,
    });
  }
}
