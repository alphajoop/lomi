# Webhook events

Register in the lomi dashboard:

`https://your-connector-host/api/webhooks/lomi`

## Primary event

| Event | When | EduPay action |
| --- | --- | --- |
| `PAYMENT_SUCCEEDED` | Charge completed | Mark fee `paid`, issue receipt, notify school |

Always verify `X-Lomi-Signature` (HMAC-SHA256 of raw body with `LOMI_WEBHOOK_SECRET`).

## Handler flow

1. Verify signature (see `server/index.js`).
2. Extract `payment_reference` and school/student ids from metadata or description.
3. Idempotent update in EduPay DB (`payment_reference` unique).
4. Optionally forward to EduPay core via `EDUPAY_WEBHOOK_FORWARD_URL`.

## Do not trust redirects alone

Parents may close the browser before MoMo confirms. Fulfillment must be webhook- or poll-driven:

`GET /transactions/{id}`

## Local debugging

```bash
pnpm run dev
# After a test payment:
curl http://localhost:3010/api/webhooks/events | jq
```

## Related

- [Handling webhooks](https://docs.lomi.africa/build/advanced-guides/handling-webhooks)
- [Verify payments](https://docs.lomi.africa/build/guides/verify-payments)
