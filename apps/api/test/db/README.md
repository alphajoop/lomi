# Postgres RPC integration tests (`test:db`)

These tests exercise the **real** Supabase/Postgres RPC logic the API depends on
(transactions, subscriptions, renewal, usage billing, refunds, checkout,
payouts, discounts). Unlike the unit specs under `src/**/*.spec.ts` (which mock
`supabase.rpc(...)`) and the static `*.contract.spec.ts` files (which regex the
SQL), these tests **call the functions against a live database and assert on the
resulting rows and state**, so they can catch logic bugs.

## Safety model

- They connect to a **dedicated test Supabase instance**, never a local
  `supabase db reset` stack. **Do not** point them at production.
- Every test runs inside a transaction that is **always `ROLLBACK`ed**. Postgres
  functions run in the caller's transaction (not autonomous), so all RPC writes
  and trigger side effects are reverted and **no webhooks/emails fire** (pg_net
  only dispatches on `COMMIT`). The shared instance is never mutated.

## Configuration

Set a Postgres connection string for the test instance in `apps/api/.env`
(already git-ignored). Any of these env vars works (checked in order):

```
SUPABASE_DB_TEST_URL=postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres
# or TEST_DATABASE_URL / DATABASE_URL_TEST
```

A **session-mode** connection string (direct `5432`, or the session pooler) is
preferred over the transaction pooler. SSL is enabled automatically for non-local
hosts.

If no connection string is set, the whole suite is **skipped** (not failed), so
`pnpm test` stays green in environments without DB access.

## Running

```bash
cd apps/api
pnpm test:db                      # all DB suites (serial)
pnpm test:db -- transactions      # a single suite
```

## Layout

| File | Scope |
| --- | --- |
| `support/client.ts` | pool, per-test `withRollback`, `callFn`/`callScalar`, `expectRpcError`, service_role claim injection |
| `support/seed.ts` | dependency-ordered seed helpers (org, merchant, customer, product, price, account, subscription, meter, Stripe card tx, disputes) + read helpers |
| `support/checkout.ts` | checkout/provider seed helpers (connect, sessions, webhooks, payouts) |
| `support/payments.ts` | payment ctx, transaction creation, balance reads |
| `_contract.db-spec.ts` | connectivity + verifies every targeted RPC exists |
| `transactions.db-spec.ts` | creation, status transitions, balance crediting, expiry, refunds |
| `payment-processing.db-spec.ts` | `process_payment`, completion triggers, refund balance reversal, Stripe card refunds |
| `disputes.db-spec.ts` | Stripe dispute create/update/lost effects, lookup helpers |
| `checkout-confirmation.db-spec.ts` | Wave / MTN / Stripe / GIM checkout confirm → credit |
| `checkout-sessions.db-spec.ts` | `create_checkout_session`, `get_checkout_session`, line items, free checkout |
| `wave-refunds.db-spec.ts` | Wave refund request, rollback, provider confirmation |
| `mtn-refunds.db-spec.ts` | MTN refund request, rollback, provider confirmation |
| `payouts-wave-refunds.db-spec.ts` | Wave partial refund via beneficiary payout + fee charges |
| `merchant-payouts.db-spec.ts` | payout fee calculation, Wave payout tx, PIN verification |
| `stripe-payments.db-spec.ts` | Stripe amount helpers, manual refund, payment failure handler |
| `spi-checkout.db-spec.ts` | SPI account provision, POS/checkout prepare, `get_pos_transactions` |
| `pos-fees.db-spec.ts` | `create_transaction` with `p_is_pos` fee path |
| `subscriptions.db-spec.ts` | first charge / signup terms, trial conversion, cancel, update |
| `renewal.db-spec.ts` | billing-date advance, dunning/retries, renewal dedup, cancel-at-period-end |
| `usage-billing.db-spec.ts` | enqueue/process events, charge calculation, period close |
| `discounts.db-spec.ts` | `validate_coupon_for_checkout` happy path + rejection cases |
| `webhook-outbox.db-spec.ts` | outbox enqueue, dispatch idempotency, state transitions, pending job fetch |

## Writing a test

```ts
import { callScalar, dbDescribe, withRollback } from './support/client';
import { createOrgWithAdmin, createCustomer, ensureReferenceData } from './support/seed';

dbDescribe('My feature', () => {
  it('does the thing', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId, merchantId } = await createOrgWithAdmin(client);
      const customerId = await createCustomer(client, organizationId, { environment: 'test' });
      const result = await callScalar(client, 'public.some_rpc', {
        p_organization_id: organizationId,
        p_customer_id: customerId,
      });
      expect(result).toBeTruthy();
    });
  });
});
```

RPCs are called with **named arguments** (`p_x => $n`), so tests are robust to
parameter reordering in SQL. Plain objects/arrays are JSON-encoded for `jsonb`
parameters automatically.
