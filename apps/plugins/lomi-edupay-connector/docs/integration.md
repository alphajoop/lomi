# Integration guide

EduPay uses **one lomi merchant organization** (Yele Group or EduPay entity). All schools are logical records in EduPay; payments route through a single API key.

## Setup

1. Create a lomi sandbox account and complete KYC when going live.
2. Copy `.env.example` → `.env` and set `LOMI_SECRET_KEY` (secret), `LOMI_PUBLISHABLE_KEY`, `LOMI_WEBHOOK_SECRET`.
3. Point dashboard webhooks to `https://your-connector/api/webhooks/lomi`.

## Charge a fee

```bash
pnpm install && pnpm run dev
./curl/charge-fee.sh
```

Or call the unified endpoint:

`POST /api/v1/fees/charge` with `payment_reference`, `school_id`, `student_id`, `fee_code`, and parent contact fields.

## Reconciliation

| Field | Purpose |
| --- | --- |
| `payment_reference` | EduPay invoice / fee record ID (idempotency: `edupay_{ref}`) |
| `metadata.school_id` | Logical school (card charges) |
| `description` | Human-readable trace for Wave/MTN (includes reference + IDs) |

On `PAYMENT_SUCCEEDED`, match `payment_reference` (card metadata) or parse `description` / transaction id for MoMo.

## Go-live checklist

- [ ] Live API keys and webhook URL
- [ ] Pending UI for async MoMo approval
- [ ] Reconciliation job (webhook + optional `GET /transactions/{id}`)
- [ ] Refund playbook with school finance team

## Related

- [Metadata contract](./metadata-contract.md)
- [Webhook events](./webhook-events.md)
