import * as crypto from 'node:crypto';
import * as http from 'node:http';
import * as https from 'node:https';
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebhookSenderService } from '../../src/webhooks/webhook-sender.service';
import {
  assertCanConnect,
  callFn,
  callScalar,
  cleanupTrackedOrganizations,
  commitDescribe,
  getPool,
  trackCleanup,
  withCommit,
  type Db,
} from './support/client';
import { createPgSupabase } from './support/pg-supabase';
import { createOrganizationWebhook } from '../db/support/checkout';
import { createOrgWithAdmin, ensureReferenceData } from '../db/support/seed';

type CapturedDelivery = {
  headers: http.IncomingHttpHeaders;
  body: string;
};

function startWebhookReceiver(): Promise<{
  url: string;
  port: number;
  deliveries: CapturedDelivery[];
  close: () => Promise<void>;
}> {
  const deliveries: CapturedDelivery[] = [];
  const tempDir = mkdtempSync(join(tmpdir(), 'lomi-webhook-commit-'));
  const keyPath = join(tempDir, 'key.pem');
  const certPath = join(tempDir, 'cert.pem');
  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 1 -nodes -subj "/CN=127.0.0.1"`,
    { stdio: 'ignore' },
  );

  const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      deliveries.push({
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  };

  const server = https.createServer(
    {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    },
    handler,
  );

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind webhook receiver'));
        return;
      }
      resolve({
        url: `https://127.0.0.1:${address.port}/webhook`,
        port: address.port,
        deliveries,
        close: () =>
          new Promise<void>((done, err) => {
            server.close((error) => (error ? err(error) : done()));
          }),
      });
    });
  });
}

async function seedCommittedWebhook(client: Db, receiverUrl: string) {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const secret = `whsec_commit_${crypto.randomUUID().replace(/-/g, '')}`;
  const webhookId = await createOrganizationWebhook(
    client,
    organizationId,
    merchantId,
    {
      url: receiverUrl,
      events: ['PAYMENT_SUCCEEDED'],
      verificationToken: secret,
      environment: 'live',
    },
  );
  trackCleanup(organizationId, merchantId);
  return { organizationId, merchantId, webhookId, secret };
}

commitDescribe('Webhook HTTP delivery :: committing harness', () => {
  beforeAll(async () => {
    process.env.WEBHOOK_COMMIT_TEST_ALLOW_LOOPBACK = 'true';
    await assertCanConnect();
  });

  afterAll(async () => {
    delete process.env.WEBHOOK_COMMIT_TEST_ALLOW_LOOPBACK;
    await cleanupTrackedOrganizations();
  });

  it('delivers HTTPS payload with valid X-Lomi-Signature after COMMIT', async () => {
    const receiver = await startWebhookReceiver();

    try {
      const seeded = await withCommit(async (client) =>
        seedCommittedWebhook(client, receiver.url),
      );

      const client = await getPool().connect();
      try {
        await client.query(
          "SELECT set_config('request.jwt.claim.role', 'service_role', true)",
        );
        const supabase = createPgSupabase(client);
        const sender = new WebhookSenderService(supabase);

        const payloadData = {
          id: `tx_commit_${crypto.randomUUID()}`,
          organization_id: seeded.organizationId,
          merchant_id: seeded.merchantId,
          status: 'completed',
        };

        const result = await sender.sendWebhookWithContext(
          {
            id: seeded.webhookId,
            url: receiver.url,
            events: ['PAYMENT_SUCCEEDED'],
            secret: seeded.secret,
            active: true,
            organization_id: seeded.organizationId,
          },
          'PAYMENT_SUCCEEDED',
          payloadData,
        );

        expect(result.success).toBe(true);

        await new Promise((resolve) => setTimeout(resolve, 250));
        expect(receiver.deliveries.length).toBeGreaterThanOrEqual(1);

        const delivery = receiver.deliveries[0];
        const signature = delivery.headers['x-lomi-signature'];
        expect(typeof signature).toBe('string');

        const expected = crypto
          .createHmac('sha256', seeded.secret)
          .update(delivery.body)
          .digest('hex');
        expect(signature).toBe(expected);

        const logCount = await client.query(
          `SELECT COUNT(*)::int AS count
             FROM public.webhook_delivery_logs
            WHERE webhook_id = $1
              AND event_type = 'PAYMENT_SUCCEEDED'`,
          [seeded.webhookId],
        );
        expect(logCount.rows[0]?.count).toBeGreaterThanOrEqual(1);
      } finally {
        client.release();
      }
    } finally {
      await receiver.close();
    }
  });

  it('enqueues outbox row on COMMIT and fetch_pending returns dispatch jobs', async () => {
    const seeded = await withCommit(async (client) => {
      const ctx = await seedCommittedWebhook(
        client,
        'https://example.test/outbox-only',
      );
      const outboxId = await callScalar<string | null>(
        client,
        'public.enqueue_merchant_webhook_outbox',
        {
          p_organization_id: ctx.organizationId,
          p_event: 'PAYMENT_SUCCEEDED',
          p_idempotency_key: `commit-outbox-${crypto.randomUUID()}`,
          p_payload: {
            id: `tx_outbox_${crypto.randomUUID()}`,
            organization_id: ctx.organizationId,
          },
          p_environment: 'live',
        },
      );
      if (!outboxId) {
        throw new Error('enqueue_merchant_webhook_outbox returned null');
      }

      await callScalar(client, 'public.webhook_dispatch_ensure', {
        p_outbox_id: outboxId,
        p_webhook_id: ctx.webhookId,
      });

      return { ...ctx, outboxId };
    });

    const client = await getPool().connect();
    try {
      const jobsRes = await callFn(
        client,
        'public.fetch_pending_webhook_outbox_jobs',
        { p_outbox_id: seeded.outboxId },
      );
      expect(jobsRes.rows.length).toBeGreaterThanOrEqual(1);
    } finally {
      client.release();
    }
  });
});
