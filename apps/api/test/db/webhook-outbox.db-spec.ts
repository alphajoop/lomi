import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { createOrganizationWebhook } from './support/checkout';
import { createOrgWithAdmin, ensureReferenceData } from './support/seed';

interface WebhookOutboxContext {
  organizationId: string;
  merchantId: string;
  webhookId: string;
}

async function seedWebhookOutboxContext(
  client: Db,
): Promise<WebhookOutboxContext> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const webhookId = await createOrganizationWebhook(
    client,
    organizationId,
    merchantId,
    {
      events: ['PAYMENT_SUCCEEDED'],
      verificationToken: 'whsec_test_harness_token',
      environment: 'live',
    },
  );
  return { organizationId, merchantId, webhookId };
}

async function enqueuePaymentSucceeded(
  client: Db,
  ctx: WebhookOutboxContext,
  idempotencyKey: string,
): Promise<string> {
  const outboxId = await callScalar<string | null>(
    client,
    'public.enqueue_merchant_webhook_outbox',
    {
      p_organization_id: ctx.organizationId,
      p_event: 'PAYMENT_SUCCEEDED',
      p_idempotency_key: idempotencyKey,
      p_payload: {
        id: `tx_${idempotencyKey}`,
        organization_id: ctx.organizationId,
        merchant_id: ctx.merchantId,
      },
      p_environment: 'live',
    },
  );
  if (!outboxId) {
    throw new Error('enqueue_merchant_webhook_outbox returned null');
  }
  return outboxId;
}

async function getDispatchForOutbox(
  client: Db,
  outboxId: string,
  webhookId: string,
): Promise<Record<string, unknown>> {
  const res = await client.query(
    `SELECT * FROM public.webhook_delivery_dispatches
      WHERE outbox_id = $1 AND webhook_id = $2`,
    [outboxId, webhookId],
  );
  return res.rows[0] as Record<string, unknown>;
}

dbDescribe('Webhook outbox :: seed', () => {
  it('creates org, merchant, and webhook with PAYMENT_SUCCEEDED + verification_token', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const res = await client.query(
        `SELECT authorized_events, verification_token, is_active
           FROM public.webhooks
          WHERE webhook_id = $1`,
        [ctx.webhookId],
      );
      const rawEvents = res.rows[0].authorized_events;
      const events = Array.isArray(rawEvents)
        ? rawEvents
        : String(rawEvents)
            .replace(/^\{|\}$/g, '')
            .split(',')
            .filter(Boolean);
      expect(events).toContain('PAYMENT_SUCCEEDED');
      expect(res.rows[0].verification_token).toBe('whsec_test_harness_token');
      expect(res.rows[0].is_active).toBe(true);
    });
  });
});

dbDescribe('Webhook outbox :: enqueue_merchant_webhook_outbox', () => {
  it('creates webhook_events_outbox row and webhook_delivery_dispatches row', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const idempotencyKey = `PAYMENT_SUCCEEDED:${ctx.webhookId}:1`;

      const outboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        idempotencyKey,
      );

      const outbox = await client.query(
        `SELECT * FROM public.webhook_events_outbox WHERE outbox_id = $1`,
        [outboxId],
      );
      expect(outbox.rows).toHaveLength(1);
      expect(outbox.rows[0].event_type).toBe('PAYMENT_SUCCEEDED');
      expect(outbox.rows[0].idempotency_key).toBe(idempotencyKey);

      const dispatch = await getDispatchForOutbox(
        client,
        outboxId,
        ctx.webhookId,
      );
      expect(dispatch).toBeDefined();
      expect(dispatch.status).toBe('pending');
    });
  });

  it('is idempotent for the same idempotency_key (same outbox_id, no duplicate dispatches)', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const idempotencyKey = `PAYMENT_SUCCEEDED:${ctx.webhookId}:idem`;

      const firstOutboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        idempotencyKey,
      );
      const secondOutboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        idempotencyKey,
      );

      expect(secondOutboxId).toBe(firstOutboxId);

      const dispatchCount = await client.query(
        `SELECT COUNT(*)::int AS count
           FROM public.webhook_delivery_dispatches
          WHERE outbox_id = $1 AND webhook_id = $2`,
        [firstOutboxId, ctx.webhookId],
      );
      expect(dispatchCount.rows[0].count).toBe(1);
    });
  });
});

dbDescribe('Webhook outbox :: dispatch RPCs', () => {
  it('webhook_dispatch_should_process returns true for a pending dispatch', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const outboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        `PAYMENT_SUCCEEDED:${ctx.webhookId}:should-process`,
      );
      const dispatch = await getDispatchForOutbox(
        client,
        outboxId,
        ctx.webhookId,
      );

      const shouldProcess = await callScalar<boolean>(
        client,
        'public.webhook_dispatch_should_process',
        { p_dispatch_id: dispatch.dispatch_id },
      );

      expect(shouldProcess).toBe(true);
    });
  });

  it('mark_webhook_dispatch_delivered updates dispatch status', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const outboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        `PAYMENT_SUCCEEDED:${ctx.webhookId}:delivered`,
      );
      const dispatch = await getDispatchForOutbox(
        client,
        outboxId,
        ctx.webhookId,
      );

      await callFn(client, 'public.mark_webhook_dispatch_delivered', {
        p_dispatch_id: dispatch.dispatch_id,
      });

      const updated = await getDispatchForOutbox(
        client,
        outboxId,
        ctx.webhookId,
      );
      expect(updated.status).toBe('delivered');
    });
  });

  it('record_webhook_delivery_attempt inserts an attempt row', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const outboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        `PAYMENT_SUCCEEDED:${ctx.webhookId}:attempt`,
      );
      const dispatch = await getDispatchForOutbox(
        client,
        outboxId,
        ctx.webhookId,
      );

      const attemptId = await callScalar<string>(
        client,
        'public.record_webhook_delivery_attempt',
        {
          p_dispatch_id: dispatch.dispatch_id,
          p_attempt_number: 1,
          p_response_status: 200,
          p_response_body: 'OK',
          p_error_message: '',
          p_request_duration_ms: 42,
        },
      );

      expect(attemptId).toBeTruthy();

      const attempts = await client.query(
        `SELECT * FROM public.webhook_delivery_attempts
          WHERE dispatch_id = $1`,
        [dispatch.dispatch_id],
      );
      expect(attempts.rows).toHaveLength(1);
      expect(attempts.rows[0].response_status).toBe(200);
      expect(attempts.rows[0].attempt_number).toBe(1);
    });
  });

  it('fetch_pending_webhook_outbox_jobs returns pending jobs for the outbox', async () => {
    await withRollback(async (client) => {
      const ctx = await seedWebhookOutboxContext(client);
      const outboxId = await enqueuePaymentSucceeded(
        client,
        ctx,
        `PAYMENT_SUCCEEDED:${ctx.webhookId}:fetch-pending`,
      );
      const dispatch = await getDispatchForOutbox(
        client,
        outboxId,
        ctx.webhookId,
      );

      const res = await callFn(
        client,
        'public.fetch_pending_webhook_outbox_jobs',
        { p_outbox_id: outboxId },
      );

      expect(res.rows.length).toBeGreaterThanOrEqual(1);
      const job = res.rows.find(
        (row) => row.dispatch_id === dispatch.dispatch_id,
      );
      const webhookRow = await client.query(
        `SELECT url FROM public.webhooks WHERE webhook_id = $1`,
        [ctx.webhookId],
      );

      expect(job).toBeDefined();
      expect(job?.outbox_id).toBe(outboxId);
      expect(job?.webhook_id).toBe(ctx.webhookId);
      expect(job?.event_type).toBe('PAYMENT_SUCCEEDED');
      expect(job?.verification_token).toBe('whsec_test_harness_token');
      expect(job?.url).toBe(webhookRow.rows[0].url);
    });
  });
});
