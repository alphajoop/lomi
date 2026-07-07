import { randomUUID } from 'node:crypto';
import { callFn, dbDescribe, withRollback, type Db } from './support/client';
import {
  accountBalance,
  completedCreditedLiveTx,
  seedPaymentCtx,
} from './support/payments';
import { ensureAccount } from './support/seed';

async function ensureBeneficiaryPayoutFee(
  client: Db,
  organizationId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO public.organization_fee_structure (
       organization_id, fee_category, fee_subcategory, name, description,
       percentage, fixed_amount, currency_code, provider_code,
       payment_method_code, fee_payer, is_active
     ) VALUES (
       $1, 'payout', 'mobile_money_beneficiary', 'Beneficiary payout',
       'Harness beneficiary payout fee', 2, 0, 'XOF', 'WAVE', 'MOBILE_MONEY',
       'merchant', true
     )`,
    [organizationId],
  );
}

async function seedMassPayoutCtx(client: Db) {
  const ctx = await seedPaymentCtx(client, 'live');
  await ensureBeneficiaryPayoutFee(client, ctx.organizationId);
  const { net } = await completedCreditedLiveTx(client, ctx, {
    amount: 50000,
    netAmount: 49000,
  });
  await ensureAccount(client, ctx.organizationId, {
    currency: 'XOF',
    balance: net,
  });
  return ctx;
}

dbDescribe(
  'Mass beneficiary payouts :: calculate_mass_payout_totals_and_balance',
  () => {
    it('returns totals and sufficient balance flag', async () => {
      await withRollback(async (client) => {
        const ctx = await seedMassPayoutCtx(client);
        const payoutData = [
          {
            amount: 5000,
            recipient_name: 'Alice',
            recipient_phone: '+22507000001',
          },
          {
            amount: 3000,
            recipient_name: 'Bob',
            recipient_phone: '+22507000002',
          },
        ];

        const res = await callFn(
          client,
          'public.calculate_mass_payout_totals_and_balance',
          {
            p_merchant_id: ctx.merchantId,
            p_currency_code: 'XOF',
            p_provider_code: 'WAVE',
            p_payout_data: payoutData,
          },
        );
        const row = res.rows[0] as Record<string, unknown>;
        expect(Number(row.total_amount)).toBe(8000);
        expect(Number(row.total_fee)).toBeGreaterThan(0);
        expect(Number(row.total_deduction)).toBeGreaterThan(8000);
        expect(row.has_sufficient_balance).toBe(true);
      });
    });

    it('reports insufficient balance when total deduction exceeds account', async () => {
      await withRollback(async (client) => {
        const ctx = await seedMassPayoutCtx(client);
        await ensureAccount(client, ctx.organizationId, {
          currency: 'XOF',
          balance: 100,
        });

        const res = await callFn(
          client,
          'public.calculate_mass_payout_totals_and_balance',
          {
            p_merchant_id: ctx.merchantId,
            p_currency_code: 'XOF',
            p_provider_code: 'WAVE',
            p_payout_data: [
              {
                amount: 50000,
                recipient_name: 'Too Big',
                recipient_phone: '+22507000003',
              },
            ],
          },
        );
        const row = res.rows[0] as Record<string, unknown>;
        expect(row.has_sufficient_balance).toBe(false);
      });
    });
  },
);

dbDescribe('Mass beneficiary payouts :: create_mass_beneficiary_payout', () => {
  it('inserts multiple beneficiary_payouts rows atomically', async () => {
    await withRollback(async (client) => {
      const ctx = await seedMassPayoutCtx(client);
      const payoutData = [
        {
          amount: 4000,
          recipient_name: 'One',
          recipient_phone: '+22507000011',
        },
        {
          amount: 3500,
          recipient_name: 'Two',
          recipient_phone: '+22507000012',
        },
      ];

      const rows = await callFn(
        client,
        'public.create_mass_beneficiary_payout',
        {
          p_merchant_id: ctx.merchantId,
          p_provider_code: 'WAVE',
          p_currency_code: 'XOF',
          p_payout_data: payoutData,
          p_bypass_payout_pin: true,
        },
      );
      expect(rows.rows.length).toBe(2);

      const stored = await client.query(
        `SELECT COUNT(*)::int AS count
           FROM public.beneficiary_payouts
          WHERE organization_id = $1`,
        [ctx.organizationId],
      );
      expect(stored.rows[0]?.count).toBe(2);
    });
  });

  it('rejects when balance is insufficient', async () => {
    await withRollback(async (client) => {
      const ctx = await seedMassPayoutCtx(client);
      await ensureAccount(client, ctx.organizationId, {
        currency: 'XOF',
        balance: 50,
      });

      await expect(
        callFn(client, 'public.create_mass_beneficiary_payout', {
          p_merchant_id: ctx.merchantId,
          p_provider_code: 'WAVE',
          p_currency_code: 'XOF',
          p_payout_data: [
            {
              amount: 10000,
              recipient_name: 'Fail',
              recipient_phone: '+22507000013',
            },
          ],
          p_bypass_payout_pin: true,
        }),
      ).rejects.toThrow(/Insufficient balance/i);
    });
  });
});

dbDescribe(
  'Mass beneficiary payouts :: create_mass_beneficiary_payout_with_wave',
  () => {
    it('records wave_payout_id per payout item', async () => {
      await withRollback(async (client) => {
        const ctx = await seedMassPayoutCtx(client);
        const waveId = `wave_mass_${randomUUID().slice(0, 10)}`;
        const rows = await callFn(
          client,
          'public.create_mass_beneficiary_payout_with_wave',
          {
            p_merchant_id: ctx.merchantId,
            p_provider_code: 'WAVE',
            p_currency_code: 'XOF',
            p_payout_data: [
              {
                amount: 2500,
                recipient_name: 'Wave One',
                recipient_phone: '+22507000021',
                wave_payout_id: waveId,
                status: 'completed',
              },
            ],
            p_bypass_payout_pin: true,
          },
        );
        expect(rows.rows[0]?.wave_payout_id).toBe(waveId);
      });
    });
  },
);

dbDescribe('Mass beneficiary payouts :: single payout debit regression', () => {
  it('debits merchant balance exactly once for completed beneficiary payout', async () => {
    await withRollback(async (client) => {
      const ctx = await seedMassPayoutCtx(client);
      const before = await accountBalance(client, ctx.organizationId);
      expect(before).not.toBeNull();

      const amount = 2500;
      const feeAmount = 50;
      const totalDeduction = amount + feeAmount;

      await callFn(client, 'public.create_beneficiary_payout_with_wave', {
        p_merchant_id: ctx.merchantId,
        p_amount: amount,
        p_currency_code: 'XOF',
        p_wave_payout_id: `wave_single_${randomUUID().slice(0, 10)}`,
        p_metadata: {
          fee_amount: feeAmount,
          total_deduction: totalDeduction,
        },
        p_status: 'completed',
        p_bypass_payout_pin: true,
      });

      const after = await accountBalance(client, ctx.organizationId);
      expect(after).toBe(Number(before) - totalDeduction);
    });
  });
});
