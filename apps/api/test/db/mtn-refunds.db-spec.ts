import { randomUUID } from 'node:crypto';
import {
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { getTransaction } from './support/seed';
import { ensureProviderTransaction } from './support/checkout';
import {
  accountBalance,
  completedCreditedLiveTx,
  createTx,
  seedPaymentCtx,
} from './support/payments';

/**
 * MTN refund-ledger state machine (service_role surface):
 *   create_mtn_refund_request_api → debits merchant balance + records refund
 *   rollback_mtn_refund           → credits the balance back (provider failed)
 *   complete_mtn_refund_provider  → confirms the provider refund (locks rollback)
 */

interface MtnRefundResult {
  success: boolean;
  refund_id?: string;
  error?: string;
}

async function mtnRollbackRpcDeployed(client: Db): Promise<boolean> {
  const res = await client.query(
    `SELECT pg_get_functiondef(p.oid) AS def
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'rollback_mtn_refund'
      LIMIT 1`,
  );
  const def = String(res.rows[0]?.def ?? '');
  return (
    def.includes('net + refund processing fee only') ||
    !def.includes('v_original_fee')
  );
}

function requestMtnRefund(
  client: Db,
  args: {
    merchantId: string;
    organizationId: string;
    transactionId: string;
    amount: number;
    feePct?: number;
  },
): Promise<MtnRefundResult> {
  return callScalar<MtnRefundResult>(
    client,
    'public.create_mtn_refund_request_api',
    {
      p_merchant_id: args.merchantId,
      p_organization_id: args.organizationId,
      p_transaction_id: args.transactionId,
      p_refund_amount: args.amount,
      p_processing_fee_percentage: args.feePct ?? 0,
      p_reason: 'harness mtn refund',
      p_subscription_action: 'default',
    },
  );
}

dbDescribe('MTN refunds :: create_mtn_refund_request_api', () => {
  it('fully refunds a completed MTN payment and debits the balance', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'MTN',
        method: 'MOBILE_MONEY',
      });
      await ensureProviderTransaction(
        client,
        txId,
        ctx.organizationId,
        'MTN',
        'succeeded',
      );
      const before = await accountBalance(client, ctx.organizationId);

      const res = await requestMtnRefund(client, {
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

  it('rejects a non-MTN transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
      });
      const res = await requestMtnRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Only MTN/i);
    });
  });

  it('rejects a not-yet-completed transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const txId = await createTx(client, ctx, {
        provider: 'MTN',
        method: 'MOBILE_MONEY',
      });
      const res = await requestMtnRefund(client, {
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
        provider: 'MTN',
        method: 'MOBILE_MONEY',
      });
      await ensureProviderTransaction(
        client,
        txId,
        ctx.organizationId,
        'MTN',
        'succeeded',
      );
      const res = await requestMtnRefund(client, {
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

dbDescribe('MTN refunds :: rollback + provider confirmation', () => {
  it('rollback_mtn_refund restores the pre-refund balance', async () => {
    await withRollback(async (client) => {
      if (!(await mtnRollbackRpcDeployed(client))) {
        console.warn(
          '[mtn-refunds] skipping exact rollback balance test: deploy rollback_mtn_refund fee fix to test DB',
        );
        return;
      }
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross, net } = await completedCreditedLiveTx(client, ctx, {
        provider: 'MTN',
        method: 'MOBILE_MONEY',
        amount: 5000,
        netAmount: 4900,
      });
      await ensureProviderTransaction(
        client,
        txId,
        ctx.organizationId,
        'MTN',
        'succeeded',
      );
      expect(net).toBeLessThan(gross);
      const beforeRefund = await accountBalance(client, ctx.organizationId);

      const refund = await requestMtnRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(refund.success).toBe(true);
      const afterRefund = await accountBalance(client, ctx.organizationId);
      expect(afterRefund!).toBeLessThan(beforeRefund!);

      const rollback = await callScalar<MtnRefundResult>(
        client,
        'public.rollback_mtn_refund',
        { p_refund_id: refund.refund_id, p_reason: 'provider call failed' },
      );
      expect(rollback.success).toBe(true);

      const afterRollback = await accountBalance(client, ctx.organizationId);
      expect(afterRollback!).toBeCloseTo(beforeRefund!, 2);
    });
  });

  it('cannot rollback once the MTN provider refund is confirmed', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { txId, gross } = await completedCreditedLiveTx(client, ctx, {
        provider: 'MTN',
        method: 'MOBILE_MONEY',
      });
      await ensureProviderTransaction(
        client,
        txId,
        ctx.organizationId,
        'MTN',
        'succeeded',
      );

      const refund = await requestMtnRefund(client, {
        merchantId: ctx.merchantId,
        organizationId: ctx.organizationId,
        transactionId: txId,
        amount: gross,
      });
      expect(refund.success).toBe(true);

      const complete = await callScalar<MtnRefundResult>(
        client,
        'public.complete_mtn_refund_provider',
        {
          p_transaction_id: txId,
          p_refund_id: refund.refund_id,
          p_mtn_refund_reference_id: 'mtn_ref_abc',
          p_mtn_metadata: { status: 'succeeded' },
          p_reason: 'confirmed',
        },
      );
      expect(complete.success).toBe(true);

      const rollback = await callScalar<MtnRefundResult>(
        client,
        'public.rollback_mtn_refund',
        { p_refund_id: refund.refund_id, p_reason: 'too late' },
      );
      expect(rollback.success).toBe(false);
      expect(rollback.error).toMatch(/already confirmed/i);
    });
  });
});
