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
| `support/seed.ts` | dependency-ordered seed helpers (org, merchant, customer, product, price, account, subscription, meter) + read helpers |
| `_contract.db-spec.ts` | connectivity + verifies every targeted RPC exists |
| `transactions.db-spec.ts` | creation, status transitions, balance crediting, expiry, refunds |
| `subscriptions.db-spec.ts` | create / activate / cancel (added after harness validation) |
| `renewal.db-spec.ts` | billing-date advance, dunning/retries (added after harness validation) |
| `usage-billing.db-spec.ts` | enqueue/process events, meter aggregation, period close (added after harness validation) |
| `other.db-spec.ts` | refunds ledger, checkout sessions, payouts, discounts (added after harness validation) |

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
