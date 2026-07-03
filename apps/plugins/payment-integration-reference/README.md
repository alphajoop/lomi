# lomi Payment Integration Reference (Raw API)

Minimal Node + Express example for integrating lomi checkout sessions and webhook verification without SDK abstractions.

## What is included

- Hosted checkout session creation from backend (`/checkout-sessions` API)
- Three checkout flows: dynamic amount, price-based, and line-items
- Webhook signature verification (`X-Lomi-Signature`, HMAC SHA256)
- Plain frontend demo + cURL scripts

## Quick start

From `payment-integration-reference/`:

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

Open `http://localhost:3000`.

## Required env vars

```env
LOMI_BASE_URL=https://api.lomi.africa
LOMI_SECRET_KEY=your-lomi-api-key
LOMI_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

`LOMI_WEBHOOK_SECRET` is preferred; `LOMI_WEBHOOK_VERIFICATION_TOKEN` is still accepted for backward compatibility.

## API routes

- `GET /api/health`
- `POST /api/checkout/dynamic`
- `POST /api/checkout/price`
- `POST /api/checkout/line-items`
- `POST /api/webhooks/lomi`
- `GET /api/webhooks/events`

## cURL examples

```bash
chmod +x curl/*.sh
./curl/create-dynamic-session.sh
PRICE_ID=your-price-id ./curl/create-price-session.sh
PRICE_ID_1=price-1 PRICE_ID_2=price-2 ./curl/create-line-items-session.sh
LOMI_SECRET_KEY=your-key ./curl/direct-lomi-checkout-session.sh
WEBHOOK_SECRET=whsec_your_webhook_signing_secret ./curl/send-signed-webhook.sh
```

## Production notes

- Keep `LOMI_SECRET_KEY` server-side only
- Verify webhook signatures before processing
- Persist + dedupe webhook events by ID in your database
