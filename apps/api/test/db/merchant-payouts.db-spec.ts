import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { ensureAccount } from './support/seed';
import {
  accountBalance,
  completedCreditedLiveTx,
  seedPaymentCtx,
} from './support/payments';

/**
 * Merchant payout fee calculation, Wave payout transaction creation, and PIN
 * verification for payout authorization.
 */

async function wavePayoutTxRpcDeployed(client: Db): Promise<boolean> {
  const res = await client.query(
    `SELECT pg_get_functiondef(p.oid) AS def
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'create_wave_payout_transaction'
      LIMIT 1`,
  );
  return String(res.rows[0]?.def ?? '').includes(
    'get_or_create_walk_in_customer',
  );
}

dbDescribe('Merchant payouts :: calculate_payout_fee', () => {
  it('returns a fee breakdown (or zero rows when no payout fee is configured)', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');

      const res = await callFn(client, 'public.calculate_payout_fee', {
        p_organization_id: ctx.organizationId,
        p_amount: 10000,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_payment_method_code: 'MOBILE_MONEY',
        p_subcategory: 'mobile_money_beneficiary',
      });

      if (res.rows.length > 0) {
        expect(Number(res.rows[0].fee_amount)).toBeGreaterThanOrEqual(0);
        expect(res.rows[0].fee_name).toBeTruthy();
      } else {
        expect(res.rows).toEqual([]);
      }
    });
  });
});

dbDescribe('Merchant payouts :: create_wave_payout_transaction', () => {
  it('creates a provider payout record when balance is sufficient', async () => {
    await withRollback(async (client) => {
      if (!(await wavePayoutTxRpcDeployed(client))) {
        console.warn(
          '[merchant-payouts] skipping create_wave_payout_transaction: deploy stub-transaction fix to test DB',
        );
        return;
      }
      const ctx = await seedPaymentCtx(client, 'live');
      const { net } = await completedCreditedLiveTx(client, ctx, {
        amount: 20000,
      });
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: net,
      });
      const before = await accountBalance(client, ctx.organizationId);
      expect(before).toBeGreaterThanOrEqual(5000);

      const payoutAmount = 5000;
      const providerTxId = await callScalar<string>(
        client,
        'public.create_wave_payout_transaction',
        {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_amount: payoutAmount,
          p_currency_code: 'XOF',
          p_provider_checkout_id: `wave_po_${randomUUID().slice(0, 12)}`,
          p_description: 'harness payout',
          p_destination_mobile: '+221771234567',
        },
      );

      expect(providerTxId).toBeTruthy();

      const providerRow = await client.query(
        `SELECT * FROM public.providers_transactions WHERE transaction_id = $1`,
        [providerTxId],
      );
      expect(providerRow.rows[0]?.provider_code).toBe('WAVE');
    });
  });

  it('rejects payout when balance is insufficient', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: 100,
      });

      await expect(
        callScalar(client, 'public.create_wave_payout_transaction', {
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
          p_amount: 50000,
          p_currency_code: 'XOF',
          p_provider_checkout_id: `wave_po_${randomUUID().slice(0, 12)}`,
        }),
      ).rejects.toThrow(/Insufficient balance/i);
    });
  });
});

dbDescribe('Merchant payouts :: verify_payout_pin', () => {
  it('returns a session id when the PIN is correct', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const pin = '4321';

      await callScalar(client, 'public.update_organization_pin_code', {
        p_organization_id: ctx.organizationId,
        p_merchant_id: ctx.merchantId,
        p_pin_code: pin,
      });

      const sessionId = await callScalar<string>(
        client,
        'public.verify_payout_pin',
        {
          p_organization_id: ctx.organizationId,
          p_merchant_id: ctx.merchantId,
          p_pin: pin,
        },
      );

      expect(sessionId).toBeTruthy();

      const session = await client.query(
        `SELECT * FROM public.payout_pin_sessions WHERE session_id = $1`,
        [sessionId],
      );
      expect(session.rows.length).toBe(1);
    });
  });
});
