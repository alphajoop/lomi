# EduPay × lomi. Connector

Partner integration for [Yele Group](https://www.yelegroup.africa/) **EduPay** — school fee collection via lomi. **direct charges** on a single merchant account.

Built on the same patterns as [`direct-charge-integration-reference`](../direct-charge-integration-reference).

## Architecture

```
EduPay backend  →  connector-api  →  @edupay/lomi-client  →  lomi. API
                         ↑
                   webhooks (PAYMENT_SUCCEEDED)
```

EduPay uses **one lomi merchant organization**. Schools are logical records in EduPay (`school_id` in charge metadata); settlement and reconciliation stay on that merchant account.

## Quick start

```bash
cd apps/plugins/lomi-edupay-connector
pnpm install
cp .env.example .env
# Edit .env — sandbox keys from dashboard.lomi.africa
pnpm run dev
```

Open **http://localhost:3010** for the sandbox UI.

```bash
chmod +x curl/*.sh
./curl/charge-fee.sh
```

## API (EduPay-facing)

### `POST /api/v1/fees/charge`

| Field | Required | Description |
| --- | --- | --- |
| `rail` | Yes | `mtn`, `wave`, or `card` |
| `amount` | Yes | XOF amount |
| `payment_reference` | Yes | EduPay fee / invoice ID |
| `school_id` | Yes | School identifier |
| `student_id` | Yes | Student identifier |
| `fee_code` | Yes | Fee type code |
| `term_id` | No | Academic term |
| `customer_name` | Yes | Parent / guardian |
| `customer_phone` | Yes | E.164 phone |
| `customer_email` | Card only | Required for card rail |

### `POST /api/webhooks/lomi`

lomi webhook receiver with signature verification. Set `EDUPAY_WEBHOOK_FORWARD_URL` to proxy events to EduPay core.

## Packages

| Path | Purpose |
| --- | --- |
| `packages/lomi-client` | Shared client — idempotency, metadata, direct charge helpers |
| `server/` | Connector API (BFF) — never expose `LOMI_SECRET_KEY` to browsers |
| `docs/` | Integration guide, metadata contract, webhooks |

## Documentation

- [Integration guide](./docs/integration.md)
- [Metadata contract](./docs/metadata-contract.md)
- [Webhook events](./docs/webhook-events.md)

## External references

- [Direct charges](https://docs.lomi.africa/build/direct-charges)

## Extracting to a standalone repo

This directory is self-contained. To publish under Yele Group:

```bash
cp -R apps/plugins/lomi-edupay-connector /path/to/lomi-edupay-connector
cd /path/to/lomi-edupay-connector && git init
```

No monorepo dependencies beyond `@lomi./sdk` on npm.

## License

Reference / partner integration — align with lomi. partner terms. Not a production EduPay deployment by itself; deploy `connector-api` to Yele infrastructure with secrets in a vault.
