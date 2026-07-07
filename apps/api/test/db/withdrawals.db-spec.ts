import { callFn, callScalar, dbDescribe, withRollback } from './support/client';
import { createPayoutMethod } from './support/checkout';
import { ensureAccount } from './support/seed';
import { accountBalance, seedPaymentCtx } from './support/payments';

/**
 * Merchant withdrawal API: initiate_withdrawal_api, balance breakdown,
 * payout lookup, and currency conversion helpers.
 */

dbDescribe('Withdrawals :: initiate_withdrawal_api', () => {
  it('creates a pending payout when balance is sufficient', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: 100_000,
      });
      const payoutMethodId = await createPayoutMethod(
        client,
        ctx.organizationId,
        {
          provider: 'WAVE',
          isDefault: true,
        },
      );

      const res = await callFn(client, 'public.initiate_withdrawal_api', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_amount: 5000,
        p_payout_method_id: payoutMethodId,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_bypass_payout_pin: true,
      });

      expect(res.rows[0].success).toBe(true);
      expect(String(res.rows[0].message)).toMatch(/success/i);

      const payouts = await client.query(
        `SELECT payout_id, amount, status
           FROM public.payouts
          WHERE organization_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [ctx.organizationId],
      );
      expect(payouts.rows.length).toBe(1);
      expect(Number(payouts.rows[0].amount)).toBe(5000);
      expect(payouts.rows[0].status).toBe('pending');

      // Ledger balance is unchanged until payout completes; available drops via pending reserve.
      expect(await accountBalance(client, ctx.organizationId)).toBe(100_000);
    });
  });

  it('rejects withdrawal when available balance is insufficient', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: 100,
      });
      const payoutMethodId = await createPayoutMethod(
        client,
        ctx.organizationId,
        {
          provider: 'WAVE',
        },
      );

      const res = await callFn(client, 'public.initiate_withdrawal_api', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_amount: 50_000,
        p_payout_method_id: payoutMethodId,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_bypass_payout_pin: true,
      });

      expect(res.rows[0].success).toBe(false);
      expect(String(res.rows[0].message)).toMatch(/insufficient/i);
    });
  });
});

dbDescribe('Withdrawals :: fetch_balance_breakdown', () => {
  it('returns the seeded available balance for the organization', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: 42_500,
      });

      const res = await callFn(client, 'public.fetch_balance_breakdown', {
        p_merchant_id: ctx.merchantId,
        p_target_currency: 'XOF',
        p_organization_id: ctx.organizationId,
      });

      expect(res.rows.length).toBeGreaterThan(0);
      const xof = res.rows.find((r) => r.currency_code === 'XOF');
      expect(xof).toBeTruthy();
      expect(Number(xof!.available_balance)).toBe(42_500);
    });
  });
});

dbDescribe('Withdrawals :: get_payout_api', () => {
  it('returns the payout row scoped to the organization', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: 50_000,
      });
      const payoutMethodId = await createPayoutMethod(
        client,
        ctx.organizationId,
        {
          provider: 'WAVE',
        },
      );

      await callFn(client, 'public.initiate_withdrawal_api', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_amount: 3000,
        p_payout_method_id: payoutMethodId,
        p_currency_code: 'XOF',
        p_provider_code: 'WAVE',
        p_bypass_payout_pin: true,
      });

      const created = await client.query(
        `SELECT payout_id FROM public.payouts
          WHERE organization_id = $1
          ORDER BY created_at DESC LIMIT 1`,
        [ctx.organizationId],
      );
      const payoutId = created.rows[0].payout_id as string;

      const res = await callFn(client, 'public.get_payout_api', {
        p_payout_id: payoutId,
        p_organization_id: ctx.organizationId,
      });

      expect(res.rows[0].payout_id).toBe(payoutId);
      expect(res.rows[0].organization_id).toBe(ctx.organizationId);
      expect(Number(res.rows[0].amount)).toBe(3000);
      expect(res.rows[0].status).toBe('pending');
    });
  });
});

dbDescribe('Withdrawals :: convert_currency', () => {
  it('returns the input amount unchanged for same-currency conversion', async () => {
    await withRollback(async (client) => {
      const ctx = await seedPaymentCtx(client, 'live');
      const converted = await callScalar<number>(
        client,
        'public.convert_currency',
        {
          p_amount: 7500,
          p_from_currency: 'XOF',
          p_to_currency: 'XOF',
          p_merchant_id: ctx.merchantId,
          p_organization_id: ctx.organizationId,
        },
      );
      expect(Number(converted)).toBe(7500);
    });
  });
});
