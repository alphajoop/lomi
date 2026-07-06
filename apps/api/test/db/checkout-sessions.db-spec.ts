import { randomUUID } from 'node:crypto';
import {
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import {
  createCheckoutSessionRpc,
  getCheckoutSession,
} from './support/checkout';
import {
  createCustomer,
  createOrgWithAdmin,
  createProduct,
  createPrice,
  ensureReferenceData,
  getTransaction,
} from './support/seed';

/**
 * Checkout session RPCs: create, fetch, line items, and free checkout recording.
 */

async function seedCheckoutCtx(client: Db): Promise<{
  organizationId: string;
  merchantId: string;
  customerId: string;
}> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment: 'live',
  });
  return { organizationId, merchantId, customerId };
}

async function createInstantPaymentLink(
  client: Db,
  organizationId: string,
  merchantId: string,
  amount = 0,
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.payment_links
       (organization_id, link_type, url, title, amount, currency_code,
        is_active, environment, created_by)
     VALUES ($1, 'instant', $2, $3, $4, 'XOF', true, 'live', $5)
     RETURNING link_id`,
    [
      organizationId,
      `https://checkout.lomi.africa/instant/${suffix}`,
      `Free link ${suffix}`,
      amount,
      merchantId,
    ],
  );
  return res.rows[0].link_id as string;
}

dbDescribe('Checkout sessions :: create_checkout_session', () => {
  it('creates an open session via RPC with a checkout URL', async () => {
    await withRollback(async (client) => {
      const { organizationId, merchantId, customerId } =
        await seedCheckoutCtx(client);

      const result = await createCheckoutSessionRpc(
        client,
        organizationId,
        merchantId,
        { amount: 7500, customerId, environment: 'live' },
      );

      expect(result.checkout_session_id).toBeTruthy();
      expect(result.checkout_url).toMatch(/checkout\.lomi\.africa/);
      expect(Number(result.amount)).toBe(7500);
      expect(result.environment).toBe('live');
    });
  });
});

dbDescribe('Checkout sessions :: get_checkout_session', () => {
  it('returns session details for a created session', async () => {
    await withRollback(async (client) => {
      const { organizationId, merchantId, customerId } =
        await seedCheckoutCtx(client);

      const created = await createCheckoutSessionRpc(
        client,
        organizationId,
        merchantId,
        { amount: 6000, customerId },
      );
      const sessionId = created.checkout_session_id as string;

      const fetched = await callScalar<Record<string, unknown>>(
        client,
        'public.get_checkout_session',
        { p_checkout_session_id: sessionId },
      );

      expect(fetched.checkout_session_id).toBe(sessionId);
      expect(fetched.organization_id).toBe(organizationId);
      expect(fetched.customer_id).toBe(customerId);
      expect(Number(fetched.amount)).toBe(6000);
      expect(fetched.status).toBe('open');

      const row = await getCheckoutSession(client, sessionId);
      expect(row?.checkout_session_id).toBe(sessionId);
    });
  });
});

dbDescribe('Checkout sessions :: create_checkout_session_with_line_items', () => {
  it('creates a session from product line items', async () => {
    await withRollback(async (client) => {
      const { organizationId, merchantId, customerId } =
        await seedCheckoutCtx(client);
      const productId = await createProduct(client, organizationId, {
        environment: 'live',
      });
      const priceId = await createPrice(client, productId, organizationId, {
        amount: 2500,
        environment: 'live',
      });

      const result = await callScalar<Record<string, unknown>>(
        client,
        'public.create_checkout_session_with_line_items',
        {
          p_organization_id: organizationId,
          p_created_by: merchantId,
          p_currency_code: 'XOF',
          p_line_items: [{ price_id: priceId, quantity: 2 }],
          p_environment: 'live',
          p_customer_id: customerId,
        },
      );

      expect(result.checkout_session_id).toBeTruthy();
      expect(Number(result.amount)).toBe(5000);
    });
  });
});

dbDescribe('Checkout sessions :: record_free_transaction', () => {
  it('records a zero-amount free checkout completion', async () => {
    await withRollback(async (client) => {
      const { organizationId, merchantId, customerId } =
        await seedCheckoutCtx(client);
      const linkId = await createInstantPaymentLink(
        client,
        organizationId,
        merchantId,
        0,
      );

      const txId = await callScalar<string>(
        client,
        'public.record_free_transaction',
        {
          p_merchant_id: merchantId,
          p_organization_id: organizationId,
          p_customer_id: customerId,
          p_link_id: linkId,
          p_currency_code: 'XOF',
          p_original_amount: 5000,
          p_discount_amount: 5000,
          p_environment: 'live',
          p_skip_free_transaction_dedupe: true,
        },
      );

      expect(txId).toBeTruthy();
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
      expect(tx?.provider_code).toBe('FREE');
      expect(Number(tx?.gross_amount)).toBe(0);
    });
  });
});
