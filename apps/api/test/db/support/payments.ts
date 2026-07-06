import { callScalar, type Db } from './client';
import {
  createCustomer,
  createOrgWithAdmin,
  ensureReferenceData,
  getTransaction,
} from './seed';

/**
 * Shared helpers for the payment-processing / refund DB suites: seed a minimal
 * org+admin+customer, create transactions, drive them to a completed+credited
 * state, and read merchant account balances. Everything runs inside the
 * caller's rolled-back transaction.
 */

export interface PaymentCtx {
  organizationId: string;
  merchantId: string;
  customerId: string;
}

export async function seedPaymentCtx(
  client: Db,
  environment: 'test' | 'live' = 'live',
): Promise<PaymentCtx> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment,
  });
  return { organizationId, merchantId, customerId };
}

export interface TxOverrides {
  amount?: number;
  provider?: string;
  method?: string;
  environment?: 'test' | 'live';
  subscriptionId?: string | null;
  /**
   * Force the stored net_amount (< gross) to model a real provider fee. The DB
   * seed carries no Wave fee config, so without this net == gross and the
   * fee-sensitive reversal math cannot be exercised.
   */
  netAmount?: number;
}

export async function createTx(
  client: Db,
  ctx: PaymentCtx,
  o: TxOverrides = {},
): Promise<string> {
  return callScalar<string>(client, 'public.create_transaction', {
    p_merchant_id: ctx.merchantId,
    p_organization_id: ctx.organizationId,
    p_customer_id: ctx.customerId,
    p_amount: o.amount ?? 5000,
    p_currency_code: 'XOF',
    p_provider_code: o.provider ?? 'WAVE',
    p_payment_method_code: o.method ?? 'MOBILE_MONEY',
    p_description: 'payment harness txn',
    p_product_id: null,
    p_subscription_id: o.subscriptionId ?? null,
    p_metadata: {},
    p_quantity: 1,
    p_environment: o.environment ?? 'live',
    p_price_id: null,
    p_is_pos: false,
  });
}

export async function accountBalance(
  client: Db,
  organizationId: string,
  currency = 'XOF',
): Promise<number | null> {
  const res = await client.query(
    `SELECT balance FROM public.accounts
      WHERE organization_id = $1 AND currency_code = $2`,
    [organizationId, currency],
  );
  return res.rows.length ? Number(res.rows[0].balance) : null;
}

/** Test-mode payments credit organization_test_balances, not accounts. */
export async function testModeBalance(
  client: Db,
  organizationId: string,
  currency = 'XOF',
): Promise<number | null> {
  const res = await client.query(
    `SELECT balance FROM public.organization_test_balances
      WHERE organization_id = $1 AND currency_code = $2`,
    [organizationId, currency],
  );
  return res.rows.length ? Number(res.rows[0].balance) : null;
}

/**
 * Create a live payment, complete it, and credit the merchant account so the
 * refund-reversal paths have a real balance to debit.
 */
export async function completedCreditedLiveTx(
  client: Db,
  ctx: PaymentCtx,
  o: TxOverrides = {},
): Promise<{ txId: string; net: number; gross: number }> {
  const gross = o.amount ?? 5000;
  const txId = await createTx(client, ctx, { ...o, environment: 'live' });
  if (o.netAmount !== undefined) {
    await client.query(
      `UPDATE public.transactions SET net_amount = $2, fee_amount = $3
        WHERE transaction_id = $1`,
      [txId, o.netAmount, gross - o.netAmount],
    );
  }
  await callScalar<boolean>(client, 'public.update_transaction_status', {
    p_transaction_id: txId,
    p_status: 'completed',
    p_metadata: {},
  });
  await callScalar<boolean>(client, 'public.update_balances_for_transaction', {
    p_transaction_id: txId,
  });
  const tx = await getTransaction(client, txId);
  return { txId, net: Number(tx?.net_amount), gross };
}
