import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
} from './support/client';
import {
  createCheckoutSession,
  createCheckoutSessionRpc,
} from './support/checkout';
import {
  createStripeCardTransaction,
  getTransaction,
} from './support/seed';
import {
  accountBalance,
  completedCreditedLiveTx,
  createTx,
  seedPaymentCtx,
} from './support/payments';

/**
 * Stripe amount helpers (pure functions) and card refund / failure handlers.
 */

dbDescribe('Stripe payments :: amount helpers', () => {
  it('round_xof_amount rounds up to the nearest 50 (minimum 50)', async () => {
    await withRollback(async (client) => {
      expect(
        Number(
          await callScalar(client, 'public.round_xof_amount', {
            p_amount: 9811,
          }),
        ),
      ).toBe(9850);
      expect(
        Number(
          await callScalar(client, 'public.round_xof_amount', {
            p_amount: 23,
          }),
        ),
      ).toBe(50);
      expect(
        Number(
          await callScalar(client, 'public.round_xof_amount', {
            p_amount: 0,
          }),
        ),
      ).toBe(0);
    });
  });

  it('convert_amount_for_stripe returns EUR cents from XOF', async () => {
    await withRollback(async (client) => {
      const res = await callFn(client, 'public.convert_amount_for_stripe', {
        p_amount_xof: 10000,
        p_target_currency: 'EUR',
        p_apply_xof_rounding: true,
      });
      expect(Number(res.rows[0].amount_in_cents)).toBeGreaterThan(0);
      expect(Number(res.rows[0].conversion_rate)).toBeGreaterThan(0);
    });
  });

  it('prepare_stripe_payment_amount normalizes checkout amounts to EUR cents', async () => {
    await withRollback(async (client) => {
      const res = await callFn(client, 'public.prepare_stripe_payment_amount', {
        p_amount: 10000,
        p_currency: 'XOF',
      });
      expect(res.rows[0].stripe_currency).toBe('eur');
      expect(Number(res.rows[0].stripe_amount_cents)).toBeGreaterThan(0);
      expect(Number(res.rows[0].original_amount_xof)).toBe(10000);
    });
  });
});

dbDescribe('Stripe payments :: create_manual_refund_request_api', () => {
  it('fully refunds a completed Stripe card payment', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await createStripeCardTransaction(client, ctx);
      const before = await accountBalance(client, ctx.organizationId);

      const res = await callScalar<{ success: boolean; refund_id?: string }>(
        client,
        'public.create_manual_refund_request_api',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_transaction_id: txId,
          p_refund_amount: gross,
          p_reason: 'harness manual refund',
        },
      );

      expect(res.success).toBe(true);
      expect(res.refund_id).toBeTruthy();
      expect(await accountBalance(client, ctx.organizationId)).toBeLessThan(
        before!,
      );

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('refunded');
    });
  });

  it('rejects non-card transactions', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });
      const res = await callScalar<{ success: boolean; error: string }>(
        client,
        'public.create_manual_refund_request_api',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_transaction_id: txId,
          p_refund_amount: gross,
        },
      );
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/card payments/i);
    });
  });
});

dbDescribe('Stripe payments :: handle_stripe_payment_failure', () => {
  it('marks the checkout transaction failed and stores the payment intent id', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const checkoutSessionId = await createCheckoutSession(
        client,
        ctx.organizationId,
        { amount: 8000, customerId: ctx.customerId, environment: 'live' },
      );

      const paymentIntentId = `pi_fail_${randomUUID().slice(0, 12)}`;
      await callScalar<string>(client, 'public.create_stripe_checkout_transaction', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_amount_xof: 8000,
        p_stripe_payment_intent_id: paymentIntentId,
        p_checkout_session_id: checkoutSessionId,
        p_environment: 'live',
      });

      const result = await callScalar<{
        success: boolean;
        transaction_id: string;
      }>(client, 'public.handle_stripe_payment_failure', {
        p_payment_intent_id: paymentIntentId,
        p_checkout_session_id: checkoutSessionId,
        p_failure_code: 'card_declined',
        p_failure_message: 'Your card was declined',
      });

      expect(result.success).toBe(true);
      const tx = await getTransaction(client, result.transaction_id);
      expect(tx?.status).toBe('failed');
      expect(tx?.stripe_payment_intent_id).toBe(paymentIntentId);
    });
  });
});
