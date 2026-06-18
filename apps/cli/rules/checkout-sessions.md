# lomi. Checkout Sessions

Create hosted checkout sessions to accept payments via lomi.

## Create a checkout session

```typescript
import { lomiApi } from './lib/lomi/client';
import type { CreateCheckoutSession } from '@lomi./sdk';

const session = await lomiApi.createCheckoutSession({
  merchant_id: 'your_merchant_id',
  success_url: 'https://your-site.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://your-site.com/cancel',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
});
```

Redirect the customer to `session.url` to complete payment.

## Key fields

- `merchant_id` — Your lomi. merchant ID
- `line_items` — Array of `{ price, quantity }` using price IDs from your products
- `success_url` / `cancel_url` — Redirect URLs after payment
- `customer_email` — Optional pre-filled email
- `metadata` — Optional key-value pairs attached to the session

## Sandbox testing

Use a test secret key (`lomi_sk_test_…`) and sandbox API URL.
See https://docs.lomi.africa/start/sandbox-payments for test cards and mobile money numbers.
