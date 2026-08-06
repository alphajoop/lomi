import { randomUUID } from 'node:crypto';
import {
  callFn,
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import { connectSpi } from './support/checkout';
import {
  createCustomer,
  createOrgWithAdmin,
  createProduct,
  ensureAccount,
  ensureReferenceData,
} from './support/seed';

async function ensureBnplConfiguration(
  client: Db,
  organizationId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO public.bnpl_configurations (
       organization_id, currency_code, customer_interest_rate,
       min_installments, max_installments, installment_frequency,
       merchant_processing_percentage, merchant_processing_fixed_amount,
       min_product_amount, require_customer_verification, require_credit_check,
       is_active
     ) VALUES ($1, 'XOF', 4, 2, 6, 'month', 4, 500, 10000, false, false, true)
     ON CONFLICT (organization_id, currency_code)
     DO UPDATE SET is_active = true, updated_at = NOW()`,
    [organizationId],
  );
}

async function ensureSpiBnplAccount(
  client: Db,
  organizationId: string,
): Promise<string> {
  await ensureAccount(client, organizationId, { currency: 'XOF', balance: 0 });
  const spiAccountNumber = `SN08BNPL${randomUUID().replace(/-/g, '').slice(0, 10)}`;
  await client.query(
    `UPDATE public.accounts
        SET is_spi_account = true,
            spi_account_number = $2,
            updated_at = NOW()
      WHERE organization_id = $1
        AND currency_code = 'XOF'`,
    [organizationId, spiAccountNumber],
  );
  return spiAccountNumber;
}

async function seedBnplCtx(client: Db) {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment: 'live',
  });
  const productId = await createProduct(client, organizationId, {
    environment: 'live',
  });
  await connectSpi(client, organizationId);
  await ensureBnplConfiguration(client, organizationId);
  const spiAccountNumber = await ensureSpiBnplAccount(client, organizationId);
  return {
    organizationId,
    merchantId,
    customerId,
    productId,
    spiAccountNumber,
  };
}

dbDescribe('BNPL installments :: calculate_bnpl_breakdown', () => {
  it('returns customer and merchant amounts for XOF', async () => {
    await withRollback(async (client) => {
      const ctx = await seedBnplCtx(client);
      const res = await callFn(client, 'public.calculate_bnpl_breakdown', {
        p_organization_id: ctx.organizationId,
        p_product_amount: 12000,
        p_installment_count: 3,
        p_currency_code: 'XOF',
      });
      const row = res.rows[0] as Record<string, unknown>;
      expect(Number(row.customer_principal)).toBe(12000);
      expect(Number(row.customer_total)).toBeGreaterThan(12000);
      expect(Number(row.merchant_receives_immediately)).toBeLessThan(12000);
    });
  });
});

dbDescribe('BNPL installments :: create_bnpl_plan_with_spi', () => {
  it('creates plan, initial transaction, installments, and payment requests', async () => {
    await withRollback(async (client) => {
      const ctx = await seedBnplCtx(client);
      const res = await callFn(client, 'public.create_bnpl_plan_with_spi', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_product_id: ctx.productId,
        p_product_amount: 12000,
        p_installment_count: 3,
        p_currency_code: 'XOF',
        p_spi_account_number: ctx.spiAccountNumber,
      });
      const row = res.rows[0] as Record<string, unknown>;
      expect(row.plan_id).toBeTruthy();
      expect(row.initial_transaction_id).toBeTruthy();
      expect(Number(row.customer_total)).toBeGreaterThan(12000);

      const installments = await client.query(
        `SELECT * FROM public.installment_payments WHERE plan_id = $1 ORDER BY sequence_number`,
        [row.plan_id],
      );
      expect(installments.rows.length).toBe(3);
      expect(installments.rows.every((r) => r.status === 'pending')).toBe(true);

      const initialTxn = await client.query(
        `SELECT is_bnpl, provider_code, payment_method_code, status
           FROM public.transactions
          WHERE transaction_id = $1`,
        [row.initial_transaction_id],
      );
      expect(initialTxn.rows[0]?.is_bnpl).toBe(true);
      expect(initialTxn.rows[0]?.provider_code).toBe('JUMBO');
      expect(initialTxn.rows[0]?.payment_method_code).toBe('BNPL');
      expect(initialTxn.rows[0]?.status).toBe('completed');

      const balance = await client.query(
        `SELECT balance FROM public.accounts
          WHERE organization_id = $1 AND currency_code = 'XOF'`,
        [ctx.organizationId],
      );
      expect(Number(balance.rows[0]?.balance)).toBeGreaterThan(0);
    });
  });
});

dbDescribe('BNPL installments :: process_bnpl_installment_payment', () => {
  it('marks installment completed on IRREVOCABLE and creates instalment transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedBnplCtx(client);
      const planRes = await callFn(client, 'public.create_bnpl_plan_with_spi', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_product_id: ctx.productId,
        p_product_amount: 12000,
        p_installment_count: 2,
        p_currency_code: 'XOF',
        p_spi_account_number: ctx.spiAccountNumber,
      });
      const planRow = planRes.rows[0] as Record<string, unknown>;
      const installment = await client.query(
        `SELECT installment_id, spi_payment_request_id
           FROM public.installment_payments
          WHERE plan_id = $1
          ORDER BY sequence_number
          LIMIT 1`,
        [planRow.plan_id],
      );
      const spiTxId = `BNPL-TX-${randomUUID().slice(0, 8)}`;

      await client.query(
        `UPDATE public.payment_requests
            SET spi_tx_id = $2
          WHERE request_id = $1`,
        [installment.rows[0].spi_payment_request_id, spiTxId],
      );

      const txnId = await callScalar<string>(
        client,
        'public.process_bnpl_installment_payment',
        {
          p_payment_request_id: installment.rows[0].spi_payment_request_id,
          p_spi_tx_id: spiTxId,
          p_payment_status: 'IRREVOCABLE',
        },
      );
      expect(txnId).toBeTruthy();

      const paid = await client.query(
        `SELECT status, transaction_id FROM public.installment_payments WHERE installment_id = $1`,
        [installment.rows[0].installment_id],
      );
      expect(paid.rows[0]?.status).toBe('completed');
      expect(paid.rows[0]?.transaction_id).toBe(txnId);
    });
  });

  it('marks installment failed on REJETE', async () => {
    await withRollback(async (client) => {
      const ctx = await seedBnplCtx(client);
      const planRes = await callFn(client, 'public.create_bnpl_plan_with_spi', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_product_id: ctx.productId,
        p_product_amount: 12000,
        p_installment_count: 2,
        p_currency_code: 'XOF',
        p_spi_account_number: ctx.spiAccountNumber,
      });
      const installment = await client.query(
        `SELECT installment_id, spi_payment_request_id
           FROM public.installment_payments
          WHERE plan_id = $1
          ORDER BY sequence_number
          LIMIT 1`,
        [(planRes.rows[0] as Record<string, unknown>).plan_id],
      );

      await callScalar(client, 'public.process_bnpl_installment_payment', {
        p_payment_request_id: installment.rows[0].spi_payment_request_id,
        p_spi_tx_id: `BNPL-FAIL-${randomUUID().slice(0, 8)}`,
        p_payment_status: 'REJETE',
      });

      const row = await client.query(
        `SELECT status FROM public.installment_payments WHERE installment_id = $1`,
        [installment.rows[0].installment_id],
      );
      expect(row.rows[0]?.status).toBe('failed');
    });
  });
});

dbDescribe('BNPL installments :: schedule and fees', () => {
  it('returns customer schedule and fee breakdown', async () => {
    await withRollback(async (client) => {
      const ctx = await seedBnplCtx(client);
      const planRes = await callFn(client, 'public.create_bnpl_plan_with_spi', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_product_id: ctx.productId,
        p_product_amount: 12000,
        p_installment_count: 3,
        p_currency_code: 'XOF',
        p_spi_account_number: ctx.spiAccountNumber,
      });
      const planId = (planRes.rows[0] as Record<string, unknown>).plan_id;

      const schedule = await callFn(
        client,
        'public.get_customer_bnpl_schedule',
        {
          p_customer_id: ctx.customerId,
          p_plan_id: planId,
        },
      );
      expect(schedule.rows.length).toBe(3);

      const fees = await callFn(client, 'public.get_bnpl_plan_fees', {
        p_plan_id: planId,
      });
      expect(fees.rows.length).toBeGreaterThan(0);
    });
  });
});

dbDescribe('BNPL installments :: complete_spi_payment router', () => {
  it('routes BNPL installment spi_tx_id to bnpl_installment completion', async () => {
    await withRollback(async (client) => {
      const ctx = await seedBnplCtx(client);
      const planRes = await callFn(client, 'public.create_bnpl_plan_with_spi', {
        p_merchant_id: ctx.merchantId,
        p_organization_id: ctx.organizationId,
        p_customer_id: ctx.customerId,
        p_product_id: ctx.productId,
        p_product_amount: 12000,
        p_installment_count: 2,
        p_currency_code: 'XOF',
        p_spi_account_number: ctx.spiAccountNumber,
      });
      const installment = await client.query(
        `SELECT spi_payment_request_id
           FROM public.installment_payments
          WHERE plan_id = $1
          ORDER BY sequence_number
          LIMIT 1`,
        [(planRes.rows[0] as Record<string, unknown>).plan_id],
      );
      const spiTxId = `BNPL-ROUTE-${randomUUID().slice(0, 8)}`;
      await client.query(
        `UPDATE public.payment_requests SET spi_tx_id = $2 WHERE request_id = $1`,
        [installment.rows[0].spi_payment_request_id, spiTxId],
      );

      const result = await callScalar<Record<string, unknown>>(
        client,
        'public.complete_spi_payment',
        {
          p_spi_tx_id: spiTxId,
          p_spi_payment_status: 'IRREVOCABLE',
          p_metadata: {},
        },
      );
      expect(result.completion_type).toBe('bnpl_installment');
      expect(result.transaction_id).toBeTruthy();
    });
  });
});
