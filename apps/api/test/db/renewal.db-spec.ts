import {
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
 * Subscription renewal billing-date advance, dunning/retry counters, and
 * cancel-at-period-end finalization.
 */

interface RenewalCtx {
  organizationId: string;
  merchantId: string;
  customerId: string;
}

async function seedRenewalCtx(client: Db): Promise<RenewalCtx> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment: 'live',
  });
  return { organizationId, merchantId, customerId };
}

async function activeMonthlySub(
  client: Db,
  ctx: RenewalCtx,
  options: {
    failedPaymentAction?: 'cancel' | 'pause' | 'continue';
    nextBillingDate?: string;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<{ subscriptionId: string; productId: string; priceId: string }> {
  const productId = await createProduct(client, ctx.organizationId, {
    type: 'recurring',
    environment: 'live',
    failedPaymentAction: options.failedPaymentAction ?? 'cancel',
  });
  const priceId = await createPrice(client, productId, ctx.organizationId, {
    amount: 5000,
    billingInterval: 'month',
    environment: 'live',
  });
  const subscriptionId = await createSubscription(
    client,
    ctx.organizationId,
    productId,
    ctx.customerId,
    {
      status: 'active',
      environment: 'live',
      priceId,
      nextBillingDate:
        options.nextBillingDate ?? new Date().toISOString().slice(0, 10),
      createdBy: ctx.merchantId,
      metadata: options.metadata ?? null,
    },
  );
  return { subscriptionId, productId, priceId };
}

dbDescribe('Renewal :: update_subscription_next_billing_date', () => {
  it('advances monthly billing date and increments current_charges', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx, {
        nextBillingDate: '2025-01-15',
      });

      const nextDate = await callScalar<Date>(
        client,
        'public.update_subscription_next_billing_date',
        { p_subscription_id: subscriptionId },
      );
      expect(nextDate).toBeInstanceOf(Date);

      const sub = await getSubscription(client, subscriptionId);
      const meta = sub?.metadata as Record<string, unknown>;
      expect(meta?.last_billing_date).toBe('2025-01-15');
      expect(Number(meta?.current_charges)).toBe(1);
      const nextBilling = new Date(String(sub?.next_billing_date))
        .toISOString()
        .slice(0, 10);
      expect(nextBilling).toBe('2025-02-15');
    });
  });

  it('advances a yearly subscription by one year', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const productId = await createProduct(client, ctx.organizationId, {
        type: 'recurring',
        environment: 'live',
        failedPaymentAction: 'cancel',
      });
      const priceId = await createPrice(client, productId, ctx.organizationId, {
        amount: 5000,
        billingInterval: 'year',
        environment: 'live',
      });
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        {
          status: 'active',
          environment: 'live',
          priceId,
          nextBillingDate: '2025-03-01',
          createdBy: ctx.merchantId,
        },
      );

      await callScalar(client, 'public.update_subscription_next_billing_date', {
        p_subscription_id: subscriptionId,
      });

      const sub = await getSubscription(client, subscriptionId);
      const meta = sub?.metadata as Record<string, unknown>;
      expect(meta?.last_billing_date).toBe('2025-03-01');
      expect(Number(meta?.current_charges)).toBe(1);
      const nextBilling = new Date(String(sub?.next_billing_date))
        .toISOString()
        .slice(0, 10);
      expect(nextBilling).toBe('2026-03-01');
    });
  });
});

dbDescribe('Renewal :: handle_subscription_failed_payment', () => {
  it('cancels when product failed_payment_action is cancel', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx, {
        failedPaymentAction: 'cancel',
      });

      const message = await callScalar<string>(
        client,
        'public.handle_subscription_failed_payment',
        { p_subscription_id: subscriptionId },
      );
      expect(message).toMatch(/cancelled/i);

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('cancelled');
    });
  });

  it('pauses when product failed_payment_action is pause', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx, {
        failedPaymentAction: 'pause',
      });

      await callScalar<string>(
        client,
        'public.handle_subscription_failed_payment',
        { p_subscription_id: subscriptionId },
      );

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('paused');
    });
  });

  it('marks past_due when product failed_payment_action is continue', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx, {
        failedPaymentAction: 'continue',
      });

      await callScalar<string>(
        client,
        'public.handle_subscription_failed_payment',
        { p_subscription_id: subscriptionId },
      );

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('past_due');
    });
  });
});

dbDescribe('Renewal :: handle_subscription_renewal_payment_failure', () => {
  it('increments renewal_failure_count and schedules a retry', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx);

      const first = await callScalar<Record<string, unknown>>(
        client,
        'public.handle_subscription_renewal_payment_failure',
        {
          p_subscription_id: subscriptionId,
          p_error: 'card_declined',
        },
      );
      expect(first.retries_exhausted).toBe(false);
      expect(Number(first.renewal_failure_count)).toBe(1);

      const sub = await getSubscription(client, subscriptionId);
      const meta = sub?.metadata as Record<string, unknown>;
      expect(Number(meta?.renewal_failure_count)).toBe(1);
      expect(meta?.next_renewal_retry_at).toBeTruthy();
      expect(sub?.status).toBe('past_due');
    });
  });

  it('flags retries_exhausted once the retry budget is spent', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx);

      const first = await callScalar<Record<string, unknown>>(
        client,
        'public.handle_subscription_renewal_payment_failure',
        { p_subscription_id: subscriptionId, p_error: 'card_declined' },
      );
      const totalRetries = Number(first.total_retries);
      expect(totalRetries).toBeGreaterThanOrEqual(1);

      // Fast-forward the counter to one below the budget so the next failure
      // deterministically exhausts the retries regardless of the configured
      // total_retries value.
      await client.query(
        `UPDATE public.subscriptions
            SET metadata = COALESCE(metadata, '{}'::jsonb)
              || jsonb_build_object('renewal_failure_count', $2::int)
          WHERE subscription_id = $1`,
        [subscriptionId, totalRetries - 1],
      );

      const last = await callScalar<Record<string, unknown>>(
        client,
        'public.handle_subscription_renewal_payment_failure',
        { p_subscription_id: subscriptionId, p_error: 'card_declined' },
      );

      expect(last.retries_exhausted).toBe(true);
      expect(Number(last.renewal_failure_count)).toBe(totalRetries);
      expect(last.next_renewal_retry_at).toBeNull();
    });
  });
});

dbDescribe('Renewal :: subscription_renewal_already_processed', () => {
  it('returns true once last_billing_date matches the billing period', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const { subscriptionId } = await activeMonthlySub(client, ctx, {
        nextBillingDate: '2025-03-01',
      });

      await callScalar(
        client,
        'public.update_subscription_next_billing_date',
        { p_subscription_id: subscriptionId },
      );

      const billingDate = '2025-03-01';
      const processed = await callScalar<boolean>(
        client,
        'public.subscription_renewal_already_processed',
        {
          p_subscription_id: subscriptionId,
          p_billing_date: billingDate,
        },
      );
      expect(processed).toBe(true);

      const notYet = await callScalar<boolean>(
        client,
        'public.subscription_renewal_already_processed',
        {
          p_subscription_id: subscriptionId,
          p_billing_date: '2024-01-01',
        },
      );
      expect(notYet).toBe(false);
    });
  });
});

dbDescribe('Renewal :: finalize_cancel_at_period_end_subscriptions', () => {
  it('cancels subscriptions scheduled to end once billing date passes', async () => {
    await withRollback(async (client) => {
      const ctx = await seedRenewalCtx(client);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const due = yesterday.toISOString().slice(0, 10);

      const { subscriptionId } = await activeMonthlySub(client, ctx, {
        nextBillingDate: due,
        metadata: { cancel_at_period_end: true },
      });

      const finalized = await callScalar<number>(
        client,
        'public.finalize_cancel_at_period_end_subscriptions',
        {},
      );
      expect(Number(finalized)).toBeGreaterThanOrEqual(1);

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('cancelled');
    });
  });
});
