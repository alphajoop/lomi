import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { getTransaction } from './support/seed';
import {
  accountBalance,
  completedCreditedLiveTx,
  seedPaymentCtx,
} from './support/payments';
import {
  platformFeeBalance,
  ensureProviderTransaction,
} from './support/checkout';

/**
 * Wave partial refund via beneficiary payout:
 *   create_beneficiary_payout_with_wave (completed) → apply_beneficiary_payout_debit
 *   create_refund → apply_wave_partial_refund_charges
 *
 * Customer receives gross via payout; merchant is debited payout total + fee charges.
 */

interface BeneficiaryPayoutRow {
  payout_id: string;
  status: string;
  message: string;
  fee_amount: number;
  total_deduction: number;
}

interface PartialChargesRow {
  success: boolean;
  error_message: string | null;
  subscription_action: Record<string, unknown>;
}

async function recordWaveBeneficiaryPayout(
  client: Db,
  args: {
    merchantId: string;
    amount: number;
    totalDeduction: number;
    feeAmount?: number;
  },
): Promise<BeneficiaryPayoutRow> {
  const res = await callFn(
    client,
    'public.create_beneficiary_payout_with_wave',
    {
      p_merchant_id: args.merchantId,
      p_amount: args.amount,
      p_currency_code: 'XOF',
      p_wave_payout_id: `wave_po_${randomUUID().slice(0, 12)}`,
      p_metadata: {
        fee_amount: args.feeAmount ?? args.totalDeduction - args.amount,
        total_deduction: args.totalDeduction,
        is_partial_refund: true,
        source: 'harness',
      },
      p_status: 'completed',
      p_bypass_payout_pin: true,
    },
  );
  return res.rows[0] as BeneficiaryPayoutRow;
}

dbDescribe('Wave partial refund :: beneficiary payout + fee charges', () => {
  it('debits payout total then applies proportional original fee + refund processing fee', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const gross = 5000;
      const net = 4900;
      const refundAmount = 2500;
      const payoutFee = 50;
      const totalDeduction = refundAmount + payoutFee;
      const refundFeePct = 1; // 1% => 25 XOF processing fee on 2500

      const { txId } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
        amount: gross,
        netAmount: net,
      });
      await ensureProviderTransaction(
        client,
        txId,
        ctx.organizationId,
        'WAVE',
        'succeeded',
      );
      const before = await accountBalance(client, ctx.organizationId);
      expect(before).toBeCloseTo(net, 2);

      const payout = await recordWaveBeneficiaryPayout(client, {
        merchantId: ctx.merchantId,
        amount: refundAmount,
        totalDeduction,
        feeAmount: payoutFee,
      });
      expect(payout.payout_id).toBeTruthy();
      expect(payout.status).toBe('completed');

      const afterPayout = await accountBalance(client, ctx.organizationId);
      expect(afterPayout!).toBeCloseTo(before! - totalDeduction, 2);

      const refundId = await callScalar<string>(
        client,
        'public.create_refund',
        {
          p_transaction_id: txId,
          p_amount: refundAmount,
          p_reason: 'partial refund via payout (harness)',
          p_provider_code: 'WAVE',
          p_metadata: {
            refund_method: 'partial_beneficiary_payout',
            is_partial_refund: true,
            source: 'harness',
          },
          p_created_by: ctx.merchantId,
          p_subscription_action: 'default',
        },
      );
      expect(refundId).toBeTruthy();

      const platformBefore = await platformFeeBalance(client, 'XOF');

      const charges = await callFn(
        client,
        'public.apply_wave_partial_refund_charges',
        {
          p_transaction_id: txId,
          p_refund_id: refundId,
          p_refund_amount: refundAmount,
          p_processing_fee_percentage: refundFeePct,
          p_subscription_action: 'default',
        },
      );
      const chargeRow = charges.rows[0] as PartialChargesRow;
      expect(chargeRow.success).toBe(true);

      const proportionalOriginalFee =
        Math.round((((gross - net) * refundAmount) / gross) * 100) / 100; // 50
      const processingFee = Math.round(refundAmount * refundFeePct) / 100; // 25
      const expectedChargeDebit = proportionalOriginalFee + processingFee;

      const afterCharges = await accountBalance(client, ctx.organizationId);
      expect(afterCharges!).toBeCloseTo(afterPayout! - expectedChargeDebit, 2);

      const platformAfter = await platformFeeBalance(client, 'XOF');
      expect(platformAfter).toBeCloseTo(platformBefore + processingFee, 2);

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
    });
  });

  it('promotes transaction to refunded when cumulative partials cover gross', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const gross = 5000;
      const net = 4900;
      const half = gross / 2;

      const { txId } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
        amount: gross,
        netAmount: net,
      });
      await ensureProviderTransaction(
        client,
        txId,
        ctx.organizationId,
        'WAVE',
        'succeeded',
      );

      for (let i = 0; i < 2; i++) {
        await recordWaveBeneficiaryPayout(client, {
          merchantId: ctx.merchantId,
          amount: half,
          totalDeduction: half,
          feeAmount: 0,
        });

        const refundId = await callScalar<string>(
          client,
          'public.create_refund',
          {
            p_transaction_id: txId,
            p_amount: half,
            p_reason: `partial ${i + 1}`,
            p_provider_code: 'WAVE',
            p_metadata: { refund_method: 'partial_beneficiary_payout' },
            p_created_by: ctx.merchantId,
            p_subscription_action: 'default',
          },
        );

        const charges = await callFn(
          client,
          'public.apply_wave_partial_refund_charges',
          {
            p_transaction_id: txId,
            p_refund_id: refundId,
            p_refund_amount: half,
            p_processing_fee_percentage: 0,
            p_subscription_action: 'default',
          },
        );
        expect((charges.rows[0] as PartialChargesRow).success).toBe(true);
      }

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('refunded');

      const pt = await client.query(
        `SELECT provider_payment_status FROM public.providers_transactions
          WHERE transaction_id = $1`,
        [txId],
      );
      expect(pt.rows[0]?.provider_payment_status).toBe('refunded');
    });
  });

  it('apply_beneficiary_payout_debit is idempotent (no double debit)', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const { net } = await completedCreditedLiveTx(client, ctx, {
        provider: 'WAVE',
        method: 'MOBILE_MONEY',
        amount: 5000,
        netAmount: 4900,
      });

      const payout = await recordWaveBeneficiaryPayout(client, {
        merchantId: ctx.merchantId,
        amount: 1000,
        totalDeduction: 1000,
        feeAmount: 0,
      });

      const afterFirst = await accountBalance(client, ctx.organizationId);
      expect(afterFirst!).toBeCloseTo(net - 1000, 2);

      await callScalar(client, 'public.apply_beneficiary_payout_debit', {
        p_payout_id: payout.payout_id,
      });

      const afterSecond = await accountBalance(client, ctx.organizationId);
      expect(afterSecond!).toBeCloseTo(afterFirst!, 2);
    });
  });
});
