import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { WebhookSenderService } from '../webhook-sender.service';
import { WebhookEvent } from '../../utils/types/api';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { attachWorkerResilience } from '../../utils/bullmq/worker-resilience';
import { LIVE_WORKER_OPTIONS } from '../../utils/bullmq/worker-options';

// LIVE worker options: short drainDelay so retries stay snappy, plus a widened
// stalled-check interval to keep idle Upstash command burn to a minimum.
@Processor('webhooks', LIVE_WORKER_OPTIONS)
export class WebhookQueueProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(WebhookQueueProcessor.name);

  constructor(
    private readonly webhookSender: WebhookSenderService,
    private readonly supabase: SupabaseService,
  ) {
    super();
  }

  onApplicationBootstrap() {
    attachWorkerResilience(this.worker, this.logger, 'webhooks');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing webhook job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts || 1})`,
    );

    const { webhook, event, data, dispatchId, outboxId, merchantId } = job.data;

    if (dispatchId) {
      const { data: shouldRun, error: srErr } = await this.supabase.rpc(
        'webhook_dispatch_should_process',
        {
          p_dispatch_id: dispatchId,
        },
      );
      if (srErr) {
        this.logger.warn(
          `webhook_dispatch_should_process error: ${srErr.message}`,
        );
      } else if (shouldRun === false) {
        this.logger.log(
          `Skipping job ${job.id}: dispatch ${dispatchId} not pending`,
        );
        return { success: true, skipped: true };
      }
    }

    const attemptNumber = job.attemptsMade + 1;

    const result = await this.webhookSender.sendWebhookWithContext(
      webhook,
      event as WebhookEvent,
      data,
      {
        dispatchId,
        outboxId,
        attemptNumber,
        merchantId,
      },
    );

    if (result.success) {
      return { success: true, webhookId: webhook.id };
    }

    if (!result.shouldRetry && dispatchId) {
      await this.supabase.rpc('mark_webhook_dispatch_dead_letter', {
        p_dispatch_id: dispatchId,
        p_reason: result.deadLetterReason ?? 'non_retryable_delivery_failure',
      });
      await this.supabase.rpc('log_webhook_delivery', {
        p_webhook_id: webhook.id,
        p_merchant_id: merchantId ?? data?.merchant_id ?? data?.organization_id,
        p_organization_id: data?.organization_id,
        p_event_type: event,
        p_payload: this.webhookSender.prepareWebhookPayload(
          event as WebhookEvent,
          data,
          outboxId,
        ),
        p_response_status: result.lastResponseStatus ?? 0,
        p_response_body:
          typeof result.lastResponseBody === 'string'
            ? result.lastResponseBody
            : JSON.stringify(result.lastResponseBody ?? {}),
        p_attempt_number: attemptNumber,
        p_headers: null,
        p_request_duration_ms: undefined,
      });
      return { success: false, terminal: true, webhookId: webhook.id };
    }

    throw new Error(
      `Webhook delivery failed for ${webhook.id} (retryable); status=${result.lastResponseStatus}`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    if (!job) return;
    const max = job.opts.attempts ?? 1;
    const dispatchId = job.data?.dispatchId as string | undefined;
    if (!dispatchId) return;
    if (job.attemptsMade < max) return;

    this.logger.warn(
      `Webhook job permanently failed after ${job.attemptsMade} attempts: ${error.message}`,
    );

    await this.supabase.rpc('mark_webhook_dispatch_dead_letter', {
      p_dispatch_id: dispatchId,
      p_reason: `exhausted_bull_attempts:${error.message?.slice(0, 500)}`,
    });

    const { webhook, event, data, outboxId, merchantId } = job.data ?? {};
    if (!webhook?.id || !event) return;

    await this.supabase.rpc('log_webhook_delivery', {
      p_webhook_id: webhook.id,
      p_merchant_id:
        merchantId ?? data?.merchant_id ?? data?.organization_id ?? null,
      p_organization_id: data?.organization_id ?? webhook.organization_id,
      p_event_type: event,
      p_payload: this.webhookSender.prepareWebhookPayload(
        event,
        data,
        outboxId,
      ),
      p_response_status: 0,
      p_response_body: error.message?.slice(0, 4000) ?? 'exhausted_retries',
      p_attempt_number: job.attemptsMade,
      p_headers: null,
      p_request_duration_ms: undefined,
    });
  }
}
