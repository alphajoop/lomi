import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import {
  createCustomer,
  createOrgWithAdmin,
  createPrice,
  createProduct,
  createSubscription,
  ensureReferenceData,
  getSubscription,
} from './support/seed';

/**
 * Subscription signup terms, trial conversion, and merchant lifecycle RPCs.
 */

interface SubCtx {
  organizationId: string;
  merchantId: string;
  customerId: string;
}

async function seedSubCtx(
  client: Db,
  environment: 'test' | 'live' = 'test',
): Promise<SubCtx> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment,
  });
  return { organizationId, merchantId, customerId };
}

async function recurringProduct(
  client: Db,
  organizationId: string,
  options: {
    amount?: number;
    firstPaymentType?: 'initial' | 'non_initial' | 'prorated';
    trialEnabled?: boolean;
    trialPeriodDays?: number;
    environment?: 'test' | 'live';
  } = {},
): Promise<{ productId: string; priceId: string }> {
  const productId = await createProduct(client, organizationId, {
    type: 'recurring',
    environment: options.environment ?? 'test',
    firstPaymentType: options.firstPaymentType ?? 'initial',
    trialEnabled: options.trialEnabled ?? false,
    trialPeriodDays: options.trialPeriodDays ?? null,
  });
  const priceId = await createPrice(client, productId, organizationId, {
    amount: options.amount ?? 10000,
    billingInterval: 'month',
    environment: options.environment ?? 'test',
  });
  return { productId, priceId };
}

dbDescribe('Subscriptions :: first charge amount', () => {
  it('charges the full price for initial first-payment type', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client);
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { amount: 10000, firstPaymentType: 'initial' },
      );
      const amount = await callScalar<number>(
        client,
        'public.calculate_subscription_first_charge_amount',
        {
          p_product_id: productId,
          p_price_id: priceId,
          p_as_of_date: '2025-01-15',
        },
      );
      expect(Number(amount)).toBe(10000);
    });
  });

  it('returns 0 when trial is enabled', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client);
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { trialEnabled: true, trialPeriodDays: 14 },
      );
      const amount = await callScalar<number>(
        client,
        'public.calculate_subscription_first_charge_amount',
        {
          p_product_id: productId,
          p_price_id: priceId,
        },
      );
      expect(Number(amount)).toBe(0);
    });
  });

  it('returns 0 for non_initial first-payment type', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client);
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { firstPaymentType: 'non_initial' },
      );
      const amount = await callScalar<number>(
        client,
        'public.calculate_subscription_first_charge_amount',
        {
          p_product_id: productId,
          p_price_id: priceId,
        },
      );
      expect(Number(amount)).toBe(0);
    });
  });

  it('prorates the first charge for prorated first-payment type', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client);
      const amountFull = 12000;
      const asOf = '2025-01-10';
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { amount: amountFull, firstPaymentType: 'prorated' },
      );

      // Derive the expected proration with the same helpers the RPC uses, so
      // the assertion is exact without hard-coding calendar math.
      const expectedRes = await client.query(
        `SELECT ROUND(
                  $1::numeric * (
                    GREATEST(
                      1,
                      public.compute_subscription_next_billing_date(
                        $2::date, 'month'::public.billing_interval, 0
                      ) - $2::date
                    )::numeric
                    / public.billing_interval_period_days(
                        'month'::public.billing_interval
                      )::numeric
                  ),
                  2
                ) AS expected`,
        [amountFull, asOf],
      );
      const expected = Number(expectedRes.rows[0].expected);

      const amount = await callScalar<number>(
        client,
        'public.calculate_subscription_first_charge_amount',
        {
          p_product_id: productId,
          p_price_id: priceId,
          p_as_of_date: asOf,
        },
      );

      expect(Number(amount)).toBeGreaterThan(0);
      expect(Number(amount)).toBeCloseTo(expected, 2);
    });
  });
});

dbDescribe('Subscriptions :: resolve_subscription_signup_terms', () => {
  it('returns charge amount, next billing date, and trial flags', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client);
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { amount: 7500, firstPaymentType: 'initial' },
      );

      const res = await callFn(
        client,
        'public.resolve_subscription_signup_terms',
        {
          p_product_id: productId,
          p_price_id: priceId,
          p_as_of_date: '2025-01-15',
        },
      );
      const terms = res.rows[0] as {
        first_charge_amount: number;
        next_billing_date: Date;
        requires_payment: boolean;
        first_payment_type: string;
        trial_enabled: boolean;
      };

      expect(Number(terms.first_charge_amount)).toBe(7500);
      expect(terms.requires_payment).toBe(true);
      expect(terms.first_payment_type).toBe('initial');
      expect(terms.trial_enabled).toBe(false);
      expect(terms.next_billing_date).toBeInstanceOf(Date);
    });
  });

  it('sets requires_payment=false and defers billing for a trial product', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client);
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { trialEnabled: true, trialPeriodDays: 7 },
      );

      const res = await callFn(
        client,
        'public.resolve_subscription_signup_terms',
        {
          p_product_id: productId,
          p_price_id: priceId,
          p_as_of_date: '2025-01-15',
        },
      );
      const terms = res.rows[0] as {
        first_charge_amount: number;
        requires_payment: boolean;
        trial_enabled: boolean;
        trial_period_days: number;
      };

      expect(Number(terms.first_charge_amount)).toBe(0);
      expect(terms.requires_payment).toBe(false);
      expect(terms.trial_enabled).toBe(true);
      expect(terms.trial_period_days).toBe(7);
    });
  });
});

dbDescribe('Subscriptions :: convert_expired_trials', () => {
  it('promotes expired trial subscriptions to active', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client, 'live');
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { environment: 'live', trialEnabled: true, trialPeriodDays: 7 },
      );
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'trial',
          environment: 'live',
          priceId,
          endDate: new Date().toISOString().slice(0, 10),
          createdBy: ctx.merchantId,
        },
      );

      const converted = await callScalar<number>(
        client,
        'public.convert_expired_trials',
        {},
      );
      expect(Number(converted)).toBeGreaterThanOrEqual(1);

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('active');
    });
  });
});

dbDescribe('Subscriptions :: cancel_customer_subscription', () => {
  it('cancels immediately when cancel_at_period_end is false', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client, 'live');
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { environment: 'live' },
      );
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'active',
          environment: 'live',
          priceId,
          createdBy: ctx.merchantId,
        },
      );

      const ok = await callScalar<boolean>(
        client,
        'public.cancel_customer_subscription',
        {
          p_subscription_id: subscriptionId,
          p_merchant_id: ctx.merchantId,
          p_cancel_at_period_end: false,
          p_cancellation_reason: 'harness immediate cancel',
        },
      );
      expect(ok).toBe(true);

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('cancelled');
    });
  });

  it('schedules cancel_at_period_end without flipping status immediately', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client, 'live');
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { environment: 'live' },
      );
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'active',
          environment: 'live',
          priceId,
          nextBillingDate: '2025-12-31',
          createdBy: ctx.merchantId,
        },
      );

      const ok = await callScalar<boolean>(
        client,
        'public.cancel_customer_subscription',
        {
          p_subscription_id: subscriptionId,
          p_merchant_id: ctx.merchantId,
          p_cancel_at_period_end: true,
          p_cancellation_reason: 'harness period-end cancel',
        },
      );
      expect(ok).toBe(true);

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('active');
      expect(
        (sub?.metadata as Record<string, unknown>)?.cancel_at_period_end,
      ).toBe(true);
    });
  });

  it('returns false when the merchant does not own the subscription', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client, 'live');
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { environment: 'live' },
      );
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'active',
          environment: 'live',
          priceId,
          createdBy: ctx.merchantId,
        },
      );

      const ok = await callScalar<boolean>(
        client,
        'public.cancel_customer_subscription',
        {
          p_subscription_id: subscriptionId,
          p_merchant_id: randomUUID(),
          p_cancel_at_period_end: false,
        },
      );
      expect(ok).toBe(false);
    });
  });
});

dbDescribe('Subscriptions :: update_customer_subscription', () => {
  it('pauses and resumes via manage_subscription', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client, 'live');
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { environment: 'live' },
      );
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'active',
          environment: 'live',
          priceId,
          createdBy: ctx.merchantId,
        },
      );

      const paused = await callScalar<boolean>(
        client,
        'public.update_customer_subscription',
        {
          p_subscription_id: subscriptionId,
          p_merchant_id: ctx.merchantId,
          p_status: 'paused',
        },
      );
      expect(paused).toBe(true);
      expect((await getSubscription(client, subscriptionId))?.status).toBe(
        'paused',
      );

      const resumed = await callScalar<boolean>(
        client,
        'public.update_customer_subscription',
        {
          p_subscription_id: subscriptionId,
          p_merchant_id: ctx.merchantId,
          p_status: 'active',
        },
      );
      expect(resumed).toBe(true);
      expect((await getSubscription(client, subscriptionId))?.status).toBe(
        'active',
      );
    });
  });

  it('merges metadata without dropping existing keys', async () => {
    await withRollback(async (client) => {
      const ctx = await seedSubCtx(client, 'live');
      const { productId, priceId } = await recurringProduct(
        client,
        ctx.organizationId,
        { environment: 'live' },
      );
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'active',
          environment: 'live',
          priceId,
          createdBy: ctx.merchantId,
          metadata: { harness_key: 'keep' },
        },
      );

      const ok = await callScalar<boolean>(
        client,
        'public.update_customer_subscription',
        {
          p_subscription_id: subscriptionId,
          p_merchant_id: ctx.merchantId,
          p_metadata: { harness_patch: 'added' },
        },
      );
      expect(ok).toBe(true);

      const meta = (await getSubscription(client, subscriptionId))
        ?.metadata as Record<string, unknown>;
      expect(meta.harness_key).toBe('keep');
      expect(meta.harness_patch).toBe('added');
    });
  });
});
