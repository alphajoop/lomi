import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import {
  connectProvider,
  createCheckoutSession,
  getCheckoutSession,
  getProviderTransaction,
} from './support/checkout';
import { getTransaction } from './support/seed';
import {
  accountBalance,
  seedPaymentCtx,
  testModeBalance,
} from './support/payments';

/**
 * Provider checkout → confirmation → balance credit flows.
 * Live mode requires explicit confirmation + balance RPC (Wave/MTN).
 * Stripe/GIM confirmation RPCs call update_balances_for_transaction internally.
 */

const AMOUNT = 5000;

async function seedLiveCheckoutCtx(client: Db) {
  const ctx = await seedPaymentCtx(client, 'live');
  await connectProvider(client, ctx.organizationId, 'WAVE');
  await connectProvider(client, ctx.organizationId, 'MTN');
  await connectProvider(client, ctx.organizationId, 'STRIPE');
  await connectProvider(client, ctx.organizationId, 'GIM');
  return ctx;
}

dbDescribe('Checkout confirmation :: WAVE live', () => {
  it('create → succeeded → credit balances exactly once + syncs checkout session', async () => {
    await withRollback(async (client) => {
      const ctx = await seedLiveCheckoutCtx(client);
      const checkoutId = await createCheckoutSession(
        client,
        ctx.organizationId,
        { amount: AMOUNT, environment: 'live', customerId: ctx.customerId },
      );
      const waveCheckoutId = `wave_co_${randomUUID().slice(0, 12)}`;

      const txId = await callScalar<string>(
        client,
        'public.create_wave_checkout_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_amount: AMOUNT,
          p_currency_code: 'XOF',
          p_provider_checkout_id: waveCheckoutId,
          p_checkout_url: 'https://checkout.wave.test/pay',
          p_error_url: 'https://merchant.test/error',
          p_success_url: 'https://merchant.test/success',
          p_checkout_session_id: checkoutId,
          p_environment: 'live',
        },
      );
      expect(txId).toBeTruthy();

      const txBefore = await getTransaction(client, txId);
      expect(txBefore?.status).toBe('pending');
      expect(Number(txBefore?.net_amount)).toBeLessThanOrEqual(AMOUNT);

      await callScalar(client, 'public.update_wave_checkout_status', {
        p_provider_checkout_id: waveCheckoutId,
        p_provider_transaction_id: `wave_tx_${randomUUID().slice(0, 8)}`,
        p_payment_status: 'succeeded',
      });

      await callScalar<boolean>(
        client,
        'public.update_balances_for_transaction',
        { p_transaction_id: txId },
      );

      const net = Number(txBefore?.net_amount);
      expect(await accountBalance(client, ctx.organizationId)).toBeCloseTo(
        net,
        2,
      );

      const txAfter = await getTransaction(client, txId);
      expect(txAfter?.status).toBe('completed');

      const session = await getCheckoutSession(client, checkoutId);
      expect(session?.status).toBe('completed');

      const pt = await getProviderTransaction(client, txId);
      expect(pt?.provider_payment_status).toBe('succeeded');

      // Idempotent re-credit
      await callScalar<boolean>(
        client,
        'public.update_balances_for_transaction',
        { p_transaction_id: txId },
      );
      expect(await accountBalance(client, ctx.organizationId)).toBeCloseTo(
        net,
        2,
      );
    });
  });
});

dbDescribe('Checkout confirmation :: WAVE test auto-credit', () => {
  it('test-mode create_wave_checkout_transaction credits balance immediately', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'test');
      await connectProvider(client, ctx.organizationId, 'WAVE');
      const waveCheckoutId = `wave_test_${randomUUID().slice(0, 12)}`;

      const txId = await callScalar<string>(
        client,
        'public.create_wave_checkout_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_amount: AMOUNT,
          p_currency_code: 'XOF',
          p_provider_checkout_id: waveCheckoutId,
          p_checkout_url: 'https://checkout.wave.test/pay',
          p_error_url: 'https://merchant.test/error',
          p_success_url: 'https://merchant.test/success',
          p_environment: 'test',
        },
      );

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
      expect(await testModeBalance(client, ctx.organizationId)).toBeGreaterThan(
        0,
      );
    });
  });
});

dbDescribe('Checkout confirmation :: MTN live', () => {
  it('create → succeeded → credit balances + syncs checkout session', async () => {
    await withRollback(async (client) => {
      const ctx = await seedLiveCheckoutCtx(client);
      const checkoutId = await createCheckoutSession(
        client,
        ctx.organizationId,
        { amount: AMOUNT, environment: 'live', customerId: ctx.customerId },
      );

      const mtnRes = await callFn(client, 'public.create_mtn_transaction', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_amount: AMOUNT,
        p_currency_code: 'XOF',
        p_checkout_session_id: checkoutId,
        p_environment: 'live',
        p_defer_test_settlement: true,
      });
      const row = mtnRes.rows[0] as {
        transaction_id: string;
        external_id: string;
      };
      expect(row.transaction_id).toBeTruthy();
      expect(row.external_id).toBeTruthy();

      const txBefore = await getTransaction(client, row.transaction_id);
      const net = Number(txBefore?.net_amount);

      await callScalar(client, 'public.update_mtn_transaction_status', {
        p_external_id: row.external_id,
        p_provider_reference_id: `mtn_ref_${randomUUID().slice(0, 8)}`,
        p_payment_status: 'succeeded',
      });

      await callScalar<boolean>(
        client,
        'public.update_balances_for_transaction',
        { p_transaction_id: row.transaction_id },
      );

      expect(await accountBalance(client, ctx.organizationId)).toBeCloseTo(
        net,
        2,
      );

      const session = await getCheckoutSession(client, checkoutId);
      expect(session?.status).toBe('completed');
    });
  });
});

dbDescribe('Checkout confirmation :: STRIPE live', () => {
  it('create → succeeded credits net via update_stripe_checkout_status', async () => {
    await withRollback(async (client) => {
      const ctx = await seedLiveCheckoutCtx(client);
      const checkoutId = await createCheckoutSession(
        client,
        ctx.organizationId,
        { amount: AMOUNT, environment: 'live', customerId: ctx.customerId },
      );
      const piId = `pi_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

      const txId = await callScalar<string>(
        client,
        'public.create_stripe_checkout_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_amount_xof: AMOUNT,
          p_stripe_payment_intent_id: piId,
          p_stripe_currency: 'USD',
          p_checkout_session_id: checkoutId,
          p_environment: 'live',
        },
      );

      const txBefore = await getTransaction(client, txId);
      const net = Number(txBefore?.net_amount);

      await callScalar(client, 'public.update_stripe_checkout_status', {
        p_stripe_payment_intent_id: piId,
        p_stripe_charge_id: `ch_${randomUUID().slice(0, 12)}`,
        p_payment_status: 'succeeded',
      });

      expect(await accountBalance(client, ctx.organizationId)).toBeCloseTo(
        net,
        2,
      );

      const txAfter = await getTransaction(client, txId);
      expect(txAfter?.status).toBe('completed');

      const session = await getCheckoutSession(client, checkoutId);
      expect(session?.status).toBe('completed');
    });
  });
});

dbDescribe('Checkout confirmation :: GIM live', () => {
  it('create → approved credits net via finalize_gim_payment', async () => {
    await withRollback(async (client) => {
      const ctx = await seedLiveCheckoutCtx(client);
      const checkoutId = await createCheckoutSession(
        client,
        ctx.organizationId,
        { amount: AMOUNT, environment: 'live', customerId: ctx.customerId },
      );
      const merchantRef = `gim_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

      const txId = await callScalar<string>(
        client,
        'public.create_gim_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_amount: AMOUNT,
          p_currency_code: 'XOF',
          p_merchant_reference: merchantRef,
          p_pan_masked: '411111******1111',
          p_amount_minor: AMOUNT * 100,
          p_checkout_session_id: checkoutId,
          p_environment: 'live',
        },
      );

      const txBefore = await getTransaction(client, txId);
      const net = Number(txBefore?.net_amount);

      const result = await callScalar<Record<string, unknown>>(
        client,
        'public.finalize_gim_payment',
        {
          p_merchant_reference: merchantRef,
          p_status: 'approved',
          p_system_reference: 123456789,
        },
      );
      expect(result?.transaction_id).toBe(txId);

      expect(await accountBalance(client, ctx.organizationId)).toBeCloseTo(
        net,
        2,
      );

      const txAfter = await getTransaction(client, txId);
      expect(txAfter?.status).toBe('completed');

      const session = await getCheckoutSession(client, checkoutId);
      expect(session?.status).toBe('completed');
    });
  });
});
