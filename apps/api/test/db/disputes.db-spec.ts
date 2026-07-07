import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import {
  createStripeCardTransaction,
  getDispute,
  getTransaction,
} from './support/seed';
import { accountBalance, seedPaymentCtx } from './support/payments';

/**
 * Stripe dispute lifecycle (service_role handlers):
 *   handle_stripe_dispute_created → dispute row + idempotent replay
 *   handle_stripe_dispute_updated → status mapping + lost effects hook
 *   apply_stripe_dispute_lost_effects → balance debit + refund
 *   transaction_has_pending_dispute / get_dispute_by_stripe_id helpers
 */

interface DisputeCreatedResult {
  success: boolean;
  dispute_id?: string;
  idempotent?: boolean;
}

function stripeDisputeId(): string {
  return `dp_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

async function seedDisputedStripeTx(client: Db): Promise<{
  ctx: Awaited<ReturnType<typeof seedPaymentCtx>>;
  txId: string;
  paymentIntentId: string;
  net: number;
}> {
  const ctx = await seedPaymentCtx(client, 'live');
  const { txId, net, paymentIntentId } = await createStripeCardTransaction(
    client,
    ctx,
  );
  return { ctx, txId, paymentIntentId, net };
}

dbDescribe('Disputes :: handle_stripe_dispute_created', () => {
  it('creates a dispute row linked to the Stripe payment intent', async () => {
    await withRollback(async (client) => {
      const { paymentIntentId } = await seedDisputedStripeTx(client);
      const stripeDispute = stripeDisputeId();

      const res = await callScalar<DisputeCreatedResult>(
        client,
        'public.handle_stripe_dispute_created',
        {
          p_stripe_dispute_id: stripeDispute,
          p_stripe_charge_id: 'ch_test_123',
          p_payment_intent_id: paymentIntentId,
          p_amount: 5000,
          p_currency: 'XOF',
          p_reason: 'fraudulent',
          p_dispute_data: { source: 'harness' },
        },
      );

      expect(res.success).toBe(true);
      expect(res.dispute_id).toBeTruthy();
      expect(res.idempotent).toBeUndefined();

      const dispute = await getDispute(client, res.dispute_id!);
      expect(dispute?.stripe_dispute_id).toBe(stripeDispute);
      expect(dispute?.status).toBe('pending');
      expect(Number(dispute?.amount)).toBe(5000);
    });
  });

  it('is idempotent when the same stripe_dispute_id is replayed', async () => {
    await withRollback(async (client) => {
      const { paymentIntentId } = await seedDisputedStripeTx(client);
      const stripeDispute = stripeDisputeId();
      const args = {
        p_stripe_dispute_id: stripeDispute,
        p_stripe_charge_id: 'ch_test_dup',
        p_payment_intent_id: paymentIntentId,
        p_amount: 5000,
        p_currency: 'XOF',
        p_reason: 'duplicate',
      };

      const first = await callScalar<DisputeCreatedResult>(
        client,
        'public.handle_stripe_dispute_created',
        args,
      );
      const second = await callScalar<DisputeCreatedResult>(
        client,
        'public.handle_stripe_dispute_created',
        args,
      );

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.idempotent).toBe(true);

      const count = await client.query(
        `SELECT COUNT(*)::int AS n FROM public.disputes WHERE stripe_dispute_id = $1`,
        [stripeDispute],
      );
      expect(count.rows[0].n).toBe(1);
    });
  });
});

dbDescribe('Disputes :: handle_stripe_dispute_updated', () => {
  it('maps Stripe status to dispute status and resolves on won', async () => {
    await withRollback(async (client) => {
      const { paymentIntentId } = await seedDisputedStripeTx(client);
      const stripeDispute = stripeDisputeId();

      await callScalar(client, 'public.handle_stripe_dispute_created', {
        p_stripe_dispute_id: stripeDispute,
        p_stripe_charge_id: 'ch_test_win',
        p_payment_intent_id: paymentIntentId,
        p_amount: 5000,
        p_currency: 'XOF',
        p_reason: 'general',
      });

      const updated = await callScalar<{
        success: boolean;
        status: string;
      }>(client, 'public.handle_stripe_dispute_updated', {
        p_stripe_dispute_id: stripeDispute,
        p_status: 'won',
        p_dispute_data: { outcome: 'won' },
      });

      expect(updated.success).toBe(true);
      expect(updated.status).toBe('resolved');

      const dispute = await getDispute(
        client,
        (
          await callFn(client, 'public.get_dispute_by_stripe_id', {
            p_stripe_dispute_id: stripeDispute,
          })
        ).rows[0].dispute_id as string,
      );
      expect(dispute?.status).toBe('resolved');
    });
  });
});

dbDescribe('Disputes :: dispute lost end-to-end', () => {
  it('handle_stripe_dispute_updated(lost) closes the dispute, refunds the tx, and debits the balance once', async () => {
    await withRollback(async (client) => {
      const { ctx, txId, paymentIntentId, net } =
        await seedDisputedStripeTx(client);
      const stripeDispute = stripeDisputeId();
      const before = await accountBalance(client, ctx.organizationId);
      expect(before).toBeCloseTo(net, 2);

      await callScalar(client, 'public.handle_stripe_dispute_created', {
        p_stripe_dispute_id: stripeDispute,
        p_stripe_charge_id: 'ch_test_lost',
        p_payment_intent_id: paymentIntentId,
        p_amount: 5000,
        p_currency: 'XOF',
        p_reason: 'product_not_received',
      });

      // Real entry point: updating to 'lost' transitions the dispute to
      // 'closed' AND applies lost effects (refund + balance debit) in one
      // call. No manual status patch needed, driving the actual webhook path.
      const updated = await callScalar<{
        success: boolean;
        status: string;
        lost_effects?: { success?: boolean; idempotent?: boolean };
      }>(client, 'public.handle_stripe_dispute_updated', {
        p_stripe_dispute_id: stripeDispute,
        p_status: 'lost',
        p_dispute_data: { outcome: 'lost' },
      });

      expect(updated.success).toBe(true);
      expect(updated.status).toBe('closed');
      expect(updated.lost_effects?.success).toBe(true);

      const lookup = await callFn(client, 'public.get_dispute_by_stripe_id', {
        p_stripe_dispute_id: stripeDispute,
      });
      const dispute = await getDispute(
        client,
        lookup.rows[0].dispute_id as string,
      );
      expect(dispute?.status).toBe('closed');
      expect(dispute?.resolution_details).toBe('lost');
      expect(
        (dispute?.evidence_details as Record<string, unknown>)
          ?.dispute_lost_applied,
      ).toBe(true);

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('refunded');

      const afterLost = await accountBalance(client, ctx.organizationId);
      expect(afterLost!).toBeLessThan(before!);

      // Replaying the same 'lost' update must be idempotent: the lost-effects
      // hook short-circuits and the balance is not debited a second time.
      const replay = await callScalar<{
        success: boolean;
        lost_effects?: { idempotent?: boolean };
      }>(client, 'public.handle_stripe_dispute_updated', {
        p_stripe_dispute_id: stripeDispute,
        p_status: 'lost',
        p_dispute_data: { outcome: 'lost' },
      });
      expect(replay.success).toBe(true);
      expect(replay.lost_effects?.idempotent).toBe(true);

      const afterReplay = await accountBalance(client, ctx.organizationId);
      expect(afterReplay!).toBeCloseTo(afterLost!, 2);
    });
  });
});

dbDescribe('Disputes :: lookup helpers', () => {
  it('transaction_has_pending_dispute is true while dispute is open', async () => {
    await withRollback(async (client) => {
      const { txId, paymentIntentId } = await seedDisputedStripeTx(client);
      const stripeDispute = stripeDisputeId();

      const before = await callScalar<boolean>(
        client,
        'public.transaction_has_pending_dispute',
        { p_transaction_id: txId },
      );
      expect(before).toBe(false);

      await callScalar(client, 'public.handle_stripe_dispute_created', {
        p_stripe_dispute_id: stripeDispute,
        p_stripe_charge_id: 'ch_test_pending',
        p_payment_intent_id: paymentIntentId,
        p_amount: 5000,
        p_currency: 'XOF',
        p_reason: 'general',
      });

      const after = await callScalar<boolean>(
        client,
        'public.transaction_has_pending_dispute',
        { p_transaction_id: txId },
      );
      expect(after).toBe(true);
    });
  });

  it('get_dispute_by_stripe_id returns dispute_id and organization_id', async () => {
    await withRollback(async (client) => {
      const { ctx, paymentIntentId } = await seedDisputedStripeTx(client);
      const stripeDispute = stripeDisputeId();

      const created = await callScalar<DisputeCreatedResult>(
        client,
        'public.handle_stripe_dispute_created',
        {
          p_stripe_dispute_id: stripeDispute,
          p_stripe_charge_id: 'ch_test_lookup',
          p_payment_intent_id: paymentIntentId,
          p_amount: 5000,
          p_currency: 'XOF',
          p_reason: 'general',
        },
      );

      const res = await callFn(client, 'public.get_dispute_by_stripe_id', {
        p_stripe_dispute_id: stripeDispute,
      });
      expect(res.rows[0].dispute_id).toBe(created.dispute_id);
      expect(res.rows[0].organization_id).toBe(ctx.organizationId);
    });
  });
});
