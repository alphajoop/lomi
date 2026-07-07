import {
  assertCanConnect,
  callFn,
  dbDescribe,
  getPool,
  hasTestDb,
  withRollback,
  type Db,
} from './support/client';

/**
 * Connectivity + RPC-contract guard. Runs first (filename sorts before the
 * domain suites) so a bad connection string or a renamed/removed RPC fails
 * loudly here instead of as confusing errors across every logic test.
 */

if (!hasTestDb()) {
  console.warn(
    '[db-spec] SUPABASE_DB_TEST_URL not set — DB integration suite is SKIPPED. ' +
      'Set it in apps/api/.env to run these tests.',
  );
}

/** RPCs the domain suites call. If SQL renames one, this catches it. */
const REQUIRED_FUNCTIONS = [
  // transactions
  'create_transaction',
  'update_transaction_status',
  'update_balances_for_transaction',
  'expire_pending_transactions_with_custom_status',
  'create_refund',
  'update_organization_balance_for_refund',
  'transaction_has_pending_dispute',
  'get_dispute_by_stripe_id',
  // subscriptions
  'compute_subscription_next_billing_date',
  'calculate_subscription_first_charge_amount',
  'resolve_subscription_signup_terms',
  'convert_expired_trials',
  'cancel_customer_subscription',
  'update_customer_subscription',
  // renewal
  'update_subscription_next_billing_date',
  'handle_subscription_failed_payment',
  'handle_subscription_renewal_payment_failure',
  'subscription_renewal_already_processed',
  'finalize_cancel_at_period_end_subscriptions',
  // usage billing
  'enqueue_usage_event',
  'process_usage_event',
  'create_meter',
  'create_usage_subscription',
  'close_usage_billing_period',
  'calculate_usage_charge',
  // payment processing
  'process_payment',
  // checkout sessions
  'create_checkout_session',
  'get_checkout_session',
  'create_checkout_session_with_line_items',
  'record_free_transaction',
  'validate_coupon_for_checkout',
  // checkout confirmation
  'create_wave_checkout_transaction',
  'update_wave_checkout_status',
  'create_mtn_transaction',
  'update_mtn_transaction_status',
  'create_stripe_checkout_transaction',
  'update_stripe_checkout_status',
  'create_gim_transaction',
  'finalize_gim_payment',
  // stripe payments / disputes
  'round_xof_amount',
  'convert_amount_for_stripe',
  'prepare_stripe_payment_amount',
  'create_manual_refund_request_api',
  'handle_stripe_payment_failure',
  'create_stripe_transaction',
  'record_pending_stripe_transaction',
  'handle_stripe_payment_success',
  'link_stripe_payment_intent_to_transaction',
  'get_transaction_by_stripe_intent',
  'handle_stripe_dispute_created',
  'handle_stripe_dispute_updated',
  'apply_stripe_dispute_lost_effects',
  'create_stripe_card_refund',
  // withdrawals
  'initiate_withdrawal_api',
  'fetch_balance_breakdown',
  'get_payout_api',
  'convert_currency',
  // wave refunds
  'create_wave_refund_request_api',
  'rollback_wave_refund',
  'complete_wave_refund_provider',
  // mtn refunds
  'create_mtn_refund_request_api',
  'rollback_mtn_refund',
  'complete_mtn_refund_provider',
  // spi checkout / pos
  'provision_spi_account',
  'prepare_checkout_spi_payment',
  'prepare_pos_spi_payment',
  'get_pos_transactions',
  // wave partial refund / payout
  'create_beneficiary_payout_with_wave',
  'apply_beneficiary_payout_debit',
  'apply_wave_partial_refund_charges',
  // merchant payouts
  'calculate_payout_fee',
  'create_wave_payout_transaction',
  'verify_payout_pin',
  'update_organization_pin_code',
] as const;

dbDescribe('DB integration harness :: connectivity + RPC contract', () => {
  beforeAll(async () => {
    await assertCanConnect();
  });

  it('connects to the test Postgres instance', async () => {
    const res = await getPool().query('SELECT version() AS version');
    expect(String(res.rows[0].version)).toMatch(/PostgreSQL/i);
  });

  it('runs inside a transaction that is rolled back (zero residue)', async () => {
    const probe = `harness_probe_${Date.now()}`;
    await withRollback(async (client: Db) => {
      await client.query(`CREATE TEMP TABLE ${probe} (id int) ON COMMIT DROP`);
      const inside = await client.query(`SELECT to_regclass($1) AS t`, [probe]);
      expect(inside.rows[0].t).not.toBeNull();
    });
    // After rollback the temp table must be gone.
    const outside = await getPool().query(`SELECT to_regclass($1) AS t`, [
      probe,
    ]);
    expect(outside.rows[0].t).toBeNull();
  });

  it('exposes every RPC the domain suites depend on', async () => {
    const res = await getPool().query(
      `SELECT proname
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND proname = ANY($1)`,
      [REQUIRED_FUNCTIONS as unknown as string[]],
    );
    const present = new Set(res.rows.map((r) => r.proname as string));
    const missing = REQUIRED_FUNCTIONS.filter((fn) => !present.has(fn));
    expect(missing).toEqual([]);
  });

  it('injects a service_role claim so auth.role() takes the privileged path', async () => {
    await withRollback(async (client: Db) => {
      const res = await client.query(
        `SELECT current_setting('request.jwt.claims', true) AS claims`,
      );
      expect(String(res.rows[0].claims)).toContain('service_role');
    });
  });

  it('named-argument RPC calls coerce types correctly (smoke)', async () => {
    await withRollback(async (client: Db) => {
      // Pure function, no seed needed: adds one month to a fixed date.
      const res = await callFn(
        client,
        'public.compute_subscription_next_billing_date',
        {
          p_from_date: '2025-01-15',
          p_billing_interval: 'month',
          p_charge_day: 0,
        },
      );
      expect(res.rows[0].result).toBeInstanceOf(Date);
    });
  });
});
