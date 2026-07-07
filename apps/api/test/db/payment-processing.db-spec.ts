import { callScalar, dbDescribe, withRollback } from './support/client';
import {
  createProduct,
  createPrice,
  createSubscription,
  getSubscription,
  getTransaction,
} from './support/seed';
import {
  accountBalance,
  completedCreditedLiveTx,
  createTx,
  seedPaymentCtx as seedCtx,
} from './support/payments';

/**
 * Core payment-processing logic that the earlier transactions suite did not
 * exercise: the process_payment entry point, the transaction-completion
 * triggers (subscription activation), and the refund ledger / balance-reversal
 * paths (generic + Stripe card).
 */

dbDescribe('Payment processing :: process_payment', () => {
  it('creates a pending payment transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client);
      const txId = await callScalar<string>(client, 'public.process_payment', {
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_amount: 7500,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_payment_method_code: 'MOBILE_MONEY',
        p_metadata: { source: 'harness' },
      });
      expect(txId).toBeTruthy();
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('pending');
      expect(tx?.transaction_type).toBe('payment');
      expect(Number(tx?.gross_amount)).toBe(7500);
    });
  });

  it('does NOT compute a fee (net == gross) — the simplified path', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client);
      const txId = await callScalar<string>(client, 'public.process_payment', {
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_amount: 10000,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_payment_method_code: 'MOBILE_MONEY',
        p_metadata: null,
      });
      const tx = await getTransaction(client, txId);
      // process_payment hardcodes fee_amount = 0, so net equals gross. This is
      // the documented "simplified" behaviour, unlike create_transaction which
      // runs calculate_transaction_fee.
      expect(Number(tx?.fee_amount)).toBe(0);
      expect(Number(tx?.net_amount)).toBe(10000);
    });
  });

  it('persists the metadata it is given', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client);
      const txId = await callScalar<string>(client, 'public.process_payment', {
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_amount: 5000,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_payment_method_code: 'MOBILE_MONEY',
        p_metadata: { order_ref: 'abc-123' },
      });
      const tx = await getTransaction(client, txId);
      expect((tx?.metadata as Record<string, unknown>)?.order_ref).toBe(
        'abc-123',
      );
    });
  });
});

dbDescribe('Payment processing :: completion triggers', () => {
  it('activates a pending subscription when its transaction completes', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const productId = await createProduct(client, ctx.organizationId, {
        type: 'recurring',
        environment: 'live',
      });
      const priceId = await createPrice(client, productId, ctx.organizationId, {
        billingInterval: 'month',
        environment: 'live',
      });
      const subscriptionId = await createSubscription(
        client,
        ctx.organizationId,
        productId,
        ctx.customerId,
        { status: 'pending', environment: 'live', priceId },
      );

      const txId = await createTx(client, ctx, { subscriptionId });
      await callScalar<boolean>(client, 'public.update_transaction_status', {
        p_transaction_id: txId,
        p_status: 'completed',
        p_metadata: {},
      });

      const sub = await getSubscription(client, subscriptionId);
      expect(sub?.status).toBe('active');
    });
  });

  it('completing a non-subscription transaction is a no-op (no error)', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const txId = await createTx(client, ctx);
      const ok = await callScalar<boolean>(
        client,
        'public.update_transaction_status',
        { p_transaction_id: txId, p_status: 'completed', p_metadata: {} },
      );
      expect(ok).toBe(true);
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
    });
  });
});

dbDescribe('Payment processing :: refund balance reversal', () => {
  it('debits the merchant account by the net amount on a full refund', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const { txId, net } = await completedCreditedLiveTx(client, ctx);

      const balanceAfterCredit = await accountBalance(
        client,
        ctx.organizationId,
      );
      expect(balanceAfterCredit).toBe(net);

      const res = await client.query(
        `SELECT * FROM public.update_organization_balance_for_refund(
           p_transaction_id => $1, p_refund_amount => $2, p_processing_fee_percentage => $3
         )`,
        [txId, 5000, 0],
      );
      expect(res.rows[0].success).toBe(true);

      const balanceAfterRefund = await accountBalance(
        client,
        ctx.organizationId,
      );
      // Full refund ⇒ deduct the whole net that was credited.
      expect(balanceAfterRefund).toBe(0);
    });
  });

  it('is idempotent once a refund row exists (no double debit)', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const { txId, net } = await completedCreditedLiveTx(client, ctx);

      // A refund row must exist for the history-based idempotency guard to arm.
      await callScalar<string>(client, 'public.create_refund', {
        p_transaction_id: txId,
        p_amount: 5000,
        p_reason: 'full',
        p_created_by: ctx.merchantId,
      });

      const first = await client.query(
        `SELECT * FROM public.update_organization_balance_for_refund(
           p_transaction_id => $1, p_refund_amount => $2, p_processing_fee_percentage => $3
         )`,
        [txId, 5000, 0],
      );
      expect(first.rows[0].success).toBe(true);
      const afterFirst = await accountBalance(client, ctx.organizationId);
      expect(afterFirst).toBe(0);

      const second = await client.query(
        `SELECT * FROM public.update_organization_balance_for_refund(
           p_transaction_id => $1, p_refund_amount => $2, p_processing_fee_percentage => $3
         )`,
        [txId, 5000, 0],
      );
      expect(second.rows[0].success).toBe(true);
      expect(String(second.rows[0].error_message)).toMatch(/already applied/i);
      const afterSecond = await accountBalance(client, ctx.organizationId);
      expect(afterSecond).toBe(0);
      expect(net).toBeGreaterThan(0);
    });
  });

  it('returns success=false for an unknown transaction', async () => {
    await withRollback(async (client) => {
      const res = await client.query(
        `SELECT * FROM public.update_organization_balance_for_refund(
           p_transaction_id => $1, p_refund_amount => $2, p_processing_fee_percentage => $3
         )`,
        ['00000000-0000-0000-0000-000000000000', 1000, 0],
      );
      expect(res.rows[0].success).toBe(false);
      expect(String(res.rows[0].error_message)).toMatch(/not found/i);
    });
  });
});

dbDescribe('Payment processing :: Stripe card refund', () => {
  it('rejects non-Stripe transactions', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const { txId } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });
      const result = await callScalar<{ success: boolean; error: string }>(
        client,
        'public.create_stripe_card_refund',
        {
          p_transaction_id: txId,
          p_refund_amount: 5000,
          p_processing_fee_percentage: 0,
          p_reason: 'test',
        },
      );
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Only Stripe card/i);
    });
  });

  it('rejects a not-yet-completed transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const txId = await createTx(client, ctx, {
        provider: 'STRIPE',
        method: 'CARDS',
      });
      const result = await callScalar<{ success: boolean; error: string }>(
        client,
        'public.create_stripe_card_refund',
        {
          p_transaction_id: txId,
          p_refund_amount: 5000,
          p_processing_fee_percentage: 0,
          p_reason: 'test',
        },
      );
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/completed/i);
    });
  });

  it('fully refunds a completed Stripe card payment and reverses the balance', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const { txId } = await completedCreditedLiveTx(client, ctx, {
        provider: 'STRIPE',
        method: 'CARDS',
      });

      const result = await callScalar<{
        success: boolean;
        refund_id: string;
        status: string;
      }>(client, 'public.create_stripe_card_refund', {
        p_transaction_id: txId,
        p_refund_amount: 5000,
        p_processing_fee_percentage: 0,
        p_reason: 'full stripe refund',
        p_stripe_refund_id: 're_test_123',
        p_stripe_charge_id: 'ch_test_123',
      });

      expect(result.success).toBe(true);
      expect(result.refund_id).toBeTruthy();

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('refunded');
      expect(await accountBalance(client, ctx.organizationId)).toBe(0);
    });
  });

  it('rejects a duplicate Stripe refund id', async () => {
    await withRollback(async (client) => {
      const ctx = await seedCtx(client, 'live');
      const { txId } = await completedCreditedLiveTx(client, ctx, {
        provider: 'STRIPE',
        method: 'CARDS',
        amount: 6000,
      });

      const first = await callScalar<{ success: boolean }>(
        client,
        'public.create_stripe_card_refund',
        {
          p_transaction_id: txId,
          p_refund_amount: 1000,
          p_processing_fee_percentage: 0,
          p_stripe_refund_id: 're_dup_1',
        },
      );
      expect(first.success).toBe(true);

      const second = await callScalar<{ success: boolean; error: string }>(
        client,
        'public.create_stripe_card_refund',
        {
          p_transaction_id: txId,
          p_refund_amount: 1000,
          p_processing_fee_percentage: 0,
          p_stripe_refund_id: 're_dup_1',
        },
      );
      expect(second.success).toBe(false);
      expect(second.error).toMatch(/already recorded/i);
    });
  });
});
