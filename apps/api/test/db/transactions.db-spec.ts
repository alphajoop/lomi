import {
  callFn,
  callScalar,
  dbDescribe,
  expectRpcError,
  withRollback,
  type Db,
} from './support/client';
import {
  createCustomer,
  createOrgWithAdmin,
  createProduct,
  ensureReferenceData,
  getTransaction,
} from './support/seed';

/**
 * Transaction lifecycle logic (Postgres RPCs).
 * Exercises creation, environment-driven status, type inference, idempotent
 * completion, balance crediting, expiry, and refund validation/status paths.
 */

interface TxContext {
  organizationId: string;
  merchantId: string;
  customerId: string;
}

async function seedTxContext(
  client: Db,
  environment: 'test' | 'live' = 'test',
): Promise<TxContext> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment,
  });
  return { organizationId, merchantId, customerId };
}

async function createTx(
  client: Db,
  ctx: TxContext,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  return callScalar<string>(client, 'public.create_transaction', {
    p_merchant_id: ctx.merchantId,
    p_organization_id: ctx.organizationId,
    p_customer_id: ctx.customerId,
    p_amount: 5000,
    p_currency_code: 'XOF',
    p_provider_code: 'WAVE',
    p_payment_method_code: 'MOBILE_MONEY',
    p_description: 'harness txn',
    p_product_id: null,
    p_subscription_id: null,
    p_metadata: {},
    p_quantity: 1,
    p_environment: 'test',
    p_price_id: null,
    p_is_pos: false,
    ...overrides,
  });
}

dbDescribe('Transactions :: creation', () => {
  it('auto-completes transactions created in test mode', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'test');
      const txId = await createTx(client, ctx, { p_environment: 'test' });
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
      expect(Number(tx?.gross_amount)).toBe(5000);
      // net = gross - fee, and the > 0 CHECK must hold.
      expect(Number(tx?.net_amount)).toBeGreaterThan(0);
      expect(Number(tx?.net_amount)).toBeLessThanOrEqual(5000);
    });
  });

  it('leaves live-mode transactions pending', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'live');
      const txId = await createTx(client, ctx, {
        p_environment: 'live',
        p_currency_code: 'XOF',
      });
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('pending');
    });
  });

  it("infers transaction_type = 'payment' for one-off charges", async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client);
      const txId = await createTx(client, ctx);
      const tx = await getTransaction(client, txId);
      expect(tx?.transaction_type).toBe('payment');
    });
  });
});

dbDescribe('Transactions :: status transitions', () => {
  it('is idempotent when completing an already-completed transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'live');
      const txId = await createTx(client, ctx, { p_environment: 'live' });

      const first = await callScalar<boolean>(
        client,
        'public.update_transaction_status',
        {
          p_transaction_id: txId,
          p_status: 'completed',
          p_metadata: { note: 'first' },
        },
      );
      const second = await callScalar<boolean>(
        client,
        'public.update_transaction_status',
        {
          p_transaction_id: txId,
          p_status: 'completed',
          p_metadata: { note: 'second' },
        },
      );

      expect(first).toBe(true);
      expect(second).toBe(true);
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
    });
  });

  it('raises when updating a non-existent transaction', async () => {
    await withRollback(async (client) => {
      await expectRpcError(
        client,
        'public.update_transaction_status',
        {
          p_transaction_id: '00000000-0000-0000-0000-000000000000',
          p_status: 'completed',
          p_metadata: {},
        },
        /not found/i,
      );
    });
  });
});

dbDescribe('Transactions :: balance crediting', () => {
  it('refuses to credit balances for a non-completed transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'live');
      const txId = await createTx(client, ctx, { p_environment: 'live' });
      await expectRpcError(
        client,
        'public.update_balances_for_transaction',
        { p_transaction_id: txId },
        /non-completed|not.*completed/i,
      );
    });
  });

  it('credits the sandbox ledger once and is idempotent on re-run', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'test');
      const txId = await createTx(client, ctx, { p_environment: 'test' });

      await callScalar<boolean>(
        client,
        'public.update_balances_for_transaction',
        { p_transaction_id: txId },
      );
      const afterFirst = await client.query(
        `SELECT balance FROM public.organization_test_balances
          WHERE organization_id = $1 AND currency_code = 'XOF'`,
        [ctx.organizationId],
      );
      expect(afterFirst.rows.length).toBe(1);
      const balanceAfterFirst = Number(afterFirst.rows[0].balance);
      expect(balanceAfterFirst).toBeGreaterThan(0);

      const tx = await getTransaction(client, txId);
      expect((tx?.metadata as Record<string, unknown>)?.balance_updated).toBe(
        true,
      );

      // Second call must be a no-op (idempotency guard on metadata flag).
      await callScalar<boolean>(
        client,
        'public.update_balances_for_transaction',
        { p_transaction_id: txId },
      );
      const afterSecond = await client.query(
        `SELECT balance FROM public.organization_test_balances
          WHERE organization_id = $1 AND currency_code = 'XOF'`,
        [ctx.organizationId],
      );
      expect(Number(afterSecond.rows[0].balance)).toBe(balanceAfterFirst);
    });
  });
});

dbDescribe('Transactions :: expiry', () => {
  it('expires pending transactions older than the cutoff', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'live');
      const txId = await createTx(client, ctx, { p_environment: 'live' });
      // Backdate so it falls outside the expiry window.
      await client.query(
        `UPDATE public.transactions
            SET created_at = NOW() - INTERVAL '2 hours'
          WHERE transaction_id = $1`,
        [txId],
      );

      const expiredCount = await callScalar<number>(
        client,
        'public.expire_pending_transactions_with_custom_status',
        { expiry_hours: 1, new_status: 'expired' },
      );
      expect(Number(expiredCount)).toBeGreaterThanOrEqual(1);

      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('expired');
    });
  });
});

dbDescribe('Transactions :: refunds', () => {
  async function completedTx(client: Db): Promise<{
    ctx: TxContext;
    txId: string;
  }> {
    const ctx = await seedTxContext(client, 'test');
    const txId = await createTx(client, ctx, { p_environment: 'test' });
    return { ctx, txId };
  }

  it('rejects refunds larger than the gross amount', async () => {
    await withRollback(async (client) => {
      const { ctx, txId } = await completedTx(client);
      await expectRpcError(
        client,
        'public.create_refund',
        {
          p_transaction_id: txId,
          p_amount: 999999,
          p_reason: 'too much',
          p_created_by: ctx.merchantId,
        },
        /exceed/i,
      );
    });
  });

  it('marks the transaction refunded on a full refund', async () => {
    await withRollback(async (client) => {
      const { ctx, txId } = await completedTx(client);
      const refundId = await callScalar<string>(
        client,
        'public.create_refund',
        {
          p_transaction_id: txId,
          p_amount: 5000,
          p_reason: 'full refund',
          p_created_by: ctx.merchantId,
        },
      );
      expect(refundId).toBeTruthy();
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('refunded');

      const refund = await client.query(
        `SELECT status FROM public.refunds WHERE refund_id = $1`,
        [refundId],
      );
      expect(refund.rows[0].status).toBe('completed');
    });
  });

  it('keeps the transaction completed on a partial refund', async () => {
    await withRollback(async (client) => {
      const { ctx, txId } = await completedTx(client);
      await callScalar<string>(client, 'public.create_refund', {
        p_transaction_id: txId,
        p_amount: 1000,
        p_reason: 'partial refund',
        p_created_by: ctx.merchantId,
      });
      const tx = await getTransaction(client, txId);
      expect(tx?.status).toBe('completed');
    });
  });

  it('rejects refunds on a non-completed (pending) transaction', async () => {
    await withRollback(async (client) => {
      const ctx = await seedTxContext(client, 'live');
      const txId = await createTx(client, ctx, { p_environment: 'live' });
      await expectRpcError(
        client,
        'public.create_refund',
        {
          p_transaction_id: txId,
          p_amount: 1000,
          p_created_by: ctx.merchantId,
        },
        /completed/i,
      );
    });
  });
});
