import { randomUUID } from 'node:crypto';
import {
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { createOrganizationWebhook } from './support/checkout';
import { createOrgWithAdmin, ensureReferenceData } from './support/seed';

async function rpcExists(client: Db, fnName: string): Promise<boolean> {
  const res = await client.query(
    `SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = $1
      LIMIT 1`,
    [fnName],
  );
  return res.rows.length > 0;
}

dbDescribe('Network webhooks :: merchant outbox enqueue', () => {
  it('enqueues NETWORK_PAYMENT_CREATED into webhook outbox with dispatch row', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId, merchantId } = await createOrgWithAdmin(client);
      const webhookId = await createOrganizationWebhook(
        client,
        organizationId,
        merchantId,
        {
          events: ['NETWORK_PAYMENT_CREATED' as never],
          environment: 'live',
        },
      );

      const idempotencyKey = `network_payment_${randomUUID()}`;
      const outboxId = await callScalar<string | null>(
        client,
        'public.enqueue_merchant_webhook_outbox',
        {
          p_organization_id: organizationId,
          p_event: 'NETWORK_PAYMENT_CREATED',
          p_idempotency_key: idempotencyKey,
          p_payload: {
            transaction_id: randomUUID(),
            network_account_id: randomUUID(),
            public_account_id: 'acct_network_test',
            member_organization_id: organizationId,
          },
          p_environment: 'live',
        },
      );
      expect(outboxId).toBeTruthy();

      await callScalar(client, 'public.webhook_dispatch_ensure', {
        p_outbox_id: outboxId,
        p_webhook_id: webhookId,
      });

      const dispatch = await client.query(
        `SELECT status FROM public.webhook_delivery_dispatches
          WHERE outbox_id = $1 AND webhook_id = $2`,
        [outboxId, webhookId],
      );
      expect(dispatch.rows.length).toBe(1);
    });
  });

  it('calls enqueue_network_webhook_event when deployed on the test database', async () => {
    await withRollback(async (client) => {
      if (!(await rpcExists(client, 'enqueue_network_webhook_event'))) {
        console.warn(
          '[network-webhooks] skipping enqueue_network_webhook_event: RPC not deployed on test DB',
        );
        return;
      }

      await ensureReferenceData(client);
      const { organizationId } = await createOrgWithAdmin(client);
      const operatorOrgId = organizationId;

      await callScalar(client, 'public.enqueue_network_webhook_event', {
        p_operator_organization_id: operatorOrgId,
        p_event: 'NETWORK_PAYMENT_CREATED',
        p_idempotency_key: `network_evt_${randomUUID()}`,
        p_payload: {
          transaction_id: randomUUID(),
          network_account_id: randomUUID(),
        },
      });

      const outbox = await client.query(
        `SELECT event_type FROM public.webhook_events_outbox
          WHERE organization_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [operatorOrgId],
      );
      expect(outbox.rows[0]?.event_type).toBe('NETWORK_PAYMENT_CREATED');
    });
  });
});
