import { randomUUID } from 'node:crypto';
import {
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { getTransaction } from './support/seed';
import {
  accountBalance,
  completedCreditedLiveTx,
  createTx,
  seedPaymentCtx,
} from './support/payments';

/**
 * Wave refund-ledger state machine (service_role surface):
 *   create_wave_refund_request_api → debits merchant balance + records refund
 *   rollback_wave_refund           → credits the balance back (provider failed)
 *   complete_wave_refund_provider  → confirms the provider refund (locks rollback)
 *
 * Balances are asserted by DIRECTION (debit / credit-back) rather than exact
 * amounts, because the debit removes the net while the rollback also restores
 * the proportional original fee — the amounts are provider-fee dependent.
 */

interface WaveRefundResult {
  success: boolean;
  refund_id?: string;
  error?: string;
}

function requestWaveRefund(
  client: Db,
  args: {
    merchantId: string;
    organizationId: string;
    transactionId: string;
    amount: number;
    feePct?: number;
  },
): Promise<WaveRefundResult> {
  return callScalar<WaveRefundResult>(
    client,
    'public.create_wave_refund_request_api',
    {
      p_merchant_id: args.merchantId,
      p_organization_id: args.organizationId,
      p_transaction_id: args.transactionId,
      p_refund_amount: args.amount,
      p_processing_fee_percentage: args.feePct ?? 0,
      p_reason: 'harness wave refund',
      p_subscription_action: 'default',
    },
  );
}

dbDescribe('Wave refunds :: create_wave_refund_request_api', () => {
  it('fully refunds a completed Wave payment and debits the balance', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });
      const before = await accountBalance(client, ctx.organizationId);

      const res = await requestWaveRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });

      expect(res.success).toBe(true);
      expect(res.refund_id).toBeTruthy();

      const after = await accountBalance(client, ctx.organizationId);
      expect(after!).toBeLessThan(before!);

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('refunded');
    });
  });

  it('rejects a non-Wave transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'STRIPE',
        method: 'CARDS',
      });
      const res = await requestWaveRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Only Wave/i);
    });
  });

  it('rejects a not-yet-completed transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const txId = await createTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });
      const res = await requestWaveRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: 5000,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/completed/i);
    });
  });

  it('rejects a merchant not linked to the organization', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });
      const res = await requestWaveRefund(client, {
        merchantId: randomUUID(),
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/does not have access/i);
    });
  });
});

dbDescribe('Wave refunds :: rollback + provider confirmation', () => {
  it('rollback_wave_refund credits the balance back', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });

      const refund = await requestWaveRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(refund.success).toBe(true);
      const afterRefund = await accountBalance(client, ctx.organizationId);

      const rollback = await callScalar<WaveRefundResult>(
        client,
        'public.rollback_wave_refund',
        { p_refund_id: refund.refund_id, p_reason: 'provider call failed' },
      );
      expect(rollback.success).toBe(true);

      const afterRollback = await accountBalance(client, ctx.organizationId);
      expect(afterRollback!).toBeGreaterThan(afterRefund!);
    });
  });

  it('cannot rollback once the Wave provider refund is confirmed', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });

      const refund = await requestWaveRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(refund.success).toBe(true);

      const complete = await callScalar<WaveRefundResult>(
        client,
        'public.complete_wave_refund_provider',
        {
          p_transaction_id: txId,
          p_refund_id: refund.refund_id,
          p_wave_refund_id: 'wave_ref_abc',
          p_wave_metadata: { status: 'succeeded' },
          p_reason: 'confirmed',
          p_refund_type: 'full',
        },
      );
      expect(complete.success).toBe(true);

      const rollback = await callScalar<WaveRefundResult>(
        client,
        'public.rollback_wave_refund',
        { p_refund_id: refund.refund_id, p_reason: 'too late' },
      );
      expect(rollback.success).toBe(false);
      expect(rollback.error).toMatch(/already confirmed/i);
    });
  });
});
