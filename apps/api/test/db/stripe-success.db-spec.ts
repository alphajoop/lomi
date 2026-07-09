import { randomUUID } from 'node:crypto';
import {
  callScalar,
  dbDescribe,
  expectRpcError,
  withRollback,
} from './support/client';
import { connectProvider, createCheckoutSession } from './support/checkout';
import { getTransaction } from './support/seed';
import { createTx, seedPaymentCtx } from './support/payments';

/**
 * Stripe transaction RPCs: create/record pending transactions, intent lookup,
 * and PI linking. payment_intent.succeeded completion uses update_stripe_checkout_status
 * (see checkout-confirmation.db-spec.ts), not a separate success RPC.
 */

async function seedStripeCtx(client: Parameters<typeof seedPaymentCtx>[0]) {
  const ctx = await seedPaymentCtx(client, 'live');
  await connectProvider(client, ctx.organizationId, 'STRIPE');
  await callScalar<number>(client, 'public.initialize_organization_fees', {
    p_organization_id: ctx.organizationId,
  });
  return ctx;
}

dbDescribe('Stripe success :: create_stripe_transaction', () => {
  it('creates a STRIPE transaction resolvable by payment intent id', async () => {
    await withRollback(async (client) => {
      const ctx = await seedStripeCtx(client);
      const paymentIntentId = `pi_create_${randomUUID().slice(0, 12)}`;

      const txId = await callScalar<string>(
        client,
        'public.create_stripe_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_amount: 6000,
          p_currency_code: 'XOF',
          p_provider_transaction_id: paymentIntentId,
          p_description: 'harness stripe create',
          p_environment: 'live',
        },
      );

      expect(txId).toBeTruthy();
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('pending');
      expect(tx?.provider_code).toBe('STRIPE');

      const lookup = await callScalar<Record<string, unknown>>(
        client,
        'public.get_transaction_by_stripe_intent',
        { p_payment_intent_id: paymentIntentId },
      );
      expect(lookup?.transaction_id).toBe(txId);
    });
  });
});

dbDescribe('Stripe success :: record_pending_stripe_transaction', () => {
  it('creates a pending tx tied to a checkout session', async () => {
    await withRollback(async (client) => {
      const ctx = await seedStripeCtx(client);
      const checkoutSessionId = await createCheckoutSession(
        client,
        ctx.organizationId,
        { amount: 4500, customerId: ctx.customerId, environment: 'live' },
      );
      const paymentIntentId = `pi_record_${randomUUID().slice(0, 12)}`;

      const txId = await callScalar<string>(
        client,
        'public.record_pending_stripe_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_link_id: checkoutSessionId,
          p_amount: 4500,
          p_currency_code: 'XOF',
          p_provider_transaction_id: paymentIntentId,
          p_environment: 'live',
        },
      );

      expect(txId).toBeTruthy();
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('pending');
      expect(tx?.checkout_session_id).toBe(checkoutSessionId);

      const lookup = await callScalar<Record<string, unknown>>(
        client,
        'public.get_transaction_by_stripe_intent',
        { p_payment_intent_id: paymentIntentId },
      );
      expect(lookup?.transaction_id).toBe(txId);
    });
  });
});

dbDescribe(
  'Stripe success :: link_stripe_payment_intent_to_transaction',
  () => {
    it('links a payment intent to an existing STRIPE transaction', async () => {
      await withRollback(async (client) => {
        const ctx = await seedPaymentCtx(client, 'live');
        const checkoutSessionId = await createCheckoutSession(
          client,
          ctx.organizationId,
          { amount: 3000, customerId: ctx.customerId, environment: 'live' },
        );
        const txId = await createTx(client, ctx, {
          provider: 'STRIPE',
          method: 'CARDS',
          environment: 'live',
        });
        const paymentIntentId = `pi_link_${randomUUID().slice(0, 12)}`;

        const linked = await callScalar<boolean>(
          client,
          'public.link_stripe_payment_intent_to_transaction',
          {
            p_transaction_id: txId,
            p_organization_id: ctx.organizationId,
            p_payment_intent_id: paymentIntentId,
            p_checkout_session_id: checkoutSessionId,
          },
        );
        expect(linked).toBe(true);

        const lookup = await callScalar<Record<string, unknown>>(
          client,
          'public.get_transaction_by_stripe_intent',
          { p_payment_intent_id: paymentIntentId },
        );
        expect(lookup?.transaction_id).toBe(txId);
      });
    });

    it('raises when the payment intent id is empty', async () => {
      await withRollback(async (client) => {
        const ctx = await seedPaymentCtx(client, 'live');
        const txId = await createTx(client, ctx, {
          provider: 'STRIPE',
          method: 'CARDS',
          environment: 'live',
        });

        await expectRpcError(
          client,
          'public.link_stripe_payment_intent_to_transaction',
          {
            p_transaction_id: txId,
            p_organization_id: ctx.organizationId,
            p_payment_intent_id: '',
          },
          /payment_intent_required/i,
        );
      });
    });
  },
);
