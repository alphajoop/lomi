# lomi. Webhooks

Handle lomi. webhook events securely in your application.

## Signature verification

lomi. signs webhooks with HMAC-SHA256 over the **raw JSON body**. The signature is in the `X-Lomi-Signature` header; the event type is in `X-Lomi-Event`.

```typescript
import crypto from 'node:crypto';

function verifyLomiWebhook(rawBody: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    throw new Error('Invalid signature');
  }
  return JSON.parse(rawBody);
}
```

## Common event types

- `PAYMENT_SUCCEEDED`
- `PAYMENT_FAILED`
- `REFUND_CREATED`
- `SUBSCRIPTION_CREATED` / `SUBSCRIPTION_UPDATED` / `SUBSCRIPTION_CANCELLED`

## Local development

**Recommended:** `lomi listen http://localhost:3000/webhooks` — receives real sandbox webhooks via cloud relay (no ngrok).

**Alternative:** `lomi dev` — local HTTP receiver on port 4242.

## Environment variable

Set `LOMI_WEBHOOK_SECRET=whsec_…` from `lomi listen` (connected event) or your dashboard webhook settings.
