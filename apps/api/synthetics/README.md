# API synthetics

Daily and on-demand smoke tests against the deployed lomi. API. Catches broken services and **abnormal error responses** (including internal config leaks like Stripe secret env var names).

## Prerequisites

- Node 20+ and pnpm (from `apps/api`)
- Merchant API keys for a dedicated canary account:
  - `LOMI_TEST_KEY` — `lomi_sk_test_...` (sandbox)
  - `LOMI_LIVE_KEY` — `lomi_sk_live_...` (live, read-only probes)

## Run locally

From `apps/api`:

```bash
# Both suites (sandbox mutating + live read-only)
LOMI_TEST_KEY=lomi_sk_test_... LOMI_LIVE_KEY=lomi_sk_live_... pnpm synthetics

# Sandbox only
LOMI_TEST_KEY=lomi_sk_test_... pnpm synthetics:sandbox

# Live read-only only
LOMI_LIVE_KEY=lomi_sk_live_... pnpm synthetics:live

# Against local API
LOMI_TEST_KEY=lomi_sk_test_... SANDBOX_API_URL=http://localhost:3000 pnpm synthetics:sandbox
```

Exit code `0` = all checks passed. Exit code `1` = at least one failure, skip with missing dependency, or leaked internal error text.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `LOMI_TEST_KEY` | Sandbox suite | Test merchant secret key |
| `LOMI_LIVE_KEY` | Live suite | Live merchant secret key (read-only checks) |
| `SANDBOX_API_URL` | No | Default `https://sandbox.api.lomi.africa` |
| `LIVE_API_URL` | No | Default `https://api.lomi.africa` |

## Output

- Console table grouped by service
- `synthetics/last-run.json` — machine-readable report (uploaded as a CI artifact)
- GitHub Actions step summary when `GITHUB_STEP_SUMMARY` is set

## What is checked

**Sandbox** (mutating): health, identity, providers, customers, products, Wave/MTN/Switch/card charges, refunds, checkout sessions, payment links/requests, transactions, subscriptions, coupons, metering, webhooks, radar, logs, accounts.

Usage billing coverage proves the async path end to end (not just that ingest returns 202):

- Standalone meter: create meter, ingest usage event, poll `GET /usage-events/:id` until `processed`, assert meter balance reflects the quantity.
- Subscription-tied metering: create a `usage_based` product, discover its auto-created meter, create a usage subscription, ingest an event with `subscription_id` (exercising the `active_usage_subscription_required` path), poll until `processed`, and assert `GET /usage-billing/subscriptions/:id/usage` reflects the balance.

Real domain webhook: a `PAYMENT_SUCCEEDED` webhook is registered before the charges and, after the MTN auto-complete charge, delivery logs are polled to confirm a successful `PAYMENT_SUCCEEDED` delivery (not just the `test.webhook` plumbing).

Billing cycle / invoice generation is intentionally not exercised here (it requires the internal `x-cron-secret` endpoint and a due subscription); it is a candidate for a future integration slice.

**Live** (read-only): health, identity, providers, balances, and list endpoints across transactions, customers, checkout, links, requests, subscriptions, refunds, payouts, disputes, products, webhooks, logs.

Every error response is scanned for internal leak patterns (Stripe/Supabase/env var names, stack traces, etc.).

## CI

Scheduled daily via `.github/workflows/app-synthetics-api.yml`. Set repository secrets `LOMI_TEST_KEY` and `LOMI_LIVE_KEY`. Optional `SLACK_WEBHOOK_URL` for failure notifications.
