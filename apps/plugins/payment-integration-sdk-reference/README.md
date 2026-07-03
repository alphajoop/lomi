# lomi Hosted Checkout Integration Reference

Minimal Node + Express example for **hosted checkout sessions** (`POST /checkout-sessions`) and webhooks. This is the default merchant integration path—use [direct-charge-integration-reference](../direct-charge-integration-reference) only when you need server-initiated `/charge/*` flows.

## What is included

- Backend checkout session creation with `@lomi./sdk` (fields match [Create checkout session](/api/checkout-sessions/CheckoutSessionsController_create))
- Frontend embed helper with `@lomi./embed`
- Dynamic amount, price-based, and line-items checkout routes
- Webhook signature verification (`X-Lomi-Signature`, HMAC SHA256)

## Quick start

From `payment-integration-sdk-reference/`:

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

Open `http://localhost:3001`.

## Required env vars

```env
LOMI_BASE_URL=https://sandbox.api.lomi.africa
LOMI_SECRET_KEY=lomi_sk_test_...
LOMI_WEBHOOK_SECRET=whsec_...
LOMI_PUBLIC_KEY=lomi_pk_test_...
```

Use **sandbox** URLs and **test** keys while integrating.

## API routes

- `GET /api/health`
- `GET /api/config`
- `POST /api/checkout/dynamic` → `POST /checkout-sessions`
- `POST /api/checkout/price` → `POST /checkout-sessions`
- `POST /api/checkout/line-items` → `POST /checkout-sessions` (line_items)
- `POST /api/webhooks/lomi`
- `GET /api/webhooks/events`

## Key implementation detail

The server serves `@lomi./embed` from:

- `GET /vendor/lomi-embed.js`

Use this local route from the demo frontend instead of hardcoding external script URLs.

## Production notes

- Keep `LOMI_SECRET_KEY` server-side only
- Send `Idempotency-Key` on session creates when retries matter; replay responses include `Idempotency-Cache-Hit: true`
- Verify webhook signatures before processing
- Persist + dedupe webhook events by ID in your database

## Docs

- [First payment](/docs/start/first-payment) — sandbox walkthrough
- [Usage billing](/docs/build/usage-billing) — metered products (separate from hosted checkout)
