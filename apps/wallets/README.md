# lomi. Wallets

**Public repo:** [github.com/lomiafrica/wallets](https://github.com/lomiafrica/wallets)

Independent product for **human-readable agent identity** (`*.lomi.pay`) and **fiat sandbox wallets** with spend guardrails. No connection to lomi. production API, dashboard, or Supabase.

Mirrors the [`apps/stellar`](https://github.com/lomiafrica/stellar) independence model: working copy in the monorepo, own git remote, integration contract only.

## What ships in v1

| Feature | Description |
| --- | --- |
| Handle claim | `acme.lomi.pay` registry + public resolve |
| Account Wallet | Owner-funded fiat balance (mock top-up) |
| Virtual Wallet | `lomi_vw_*` API keys with allowance, max tx, allowlist |
| Pay | `POST /v1/pay` debits parent account when policy allows |

Not in v1: x402, USDC custody, Monetization Gateway, core `accounts` wiring.

## Requirements

- Node.js 22+
- pnpm

## Quick start

```bash
cd apps/wallets
pnpm install
cp .env.example .env
pnpm start:dev
```

Open [http://localhost:3460](http://localhost:3460) for the minimal claim/fund UI.

## API flow (curl)

### 1. Owner session (stub login)

```bash
SESSION=$(curl -sS -X POST http://localhost:3460/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@example.com"}')
TOKEN=$(echo "$SESSION" | node -pe 'JSON.parse(process.argv[1]).token')
```

### 2. Claim handle

```bash
curl -sS -X POST http://localhost:3460/v1/handles/claim \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"handle":"demo"}'
```

### 3. Fund account wallet (mock)

```bash
AW_ID="<account_wallet_id from claim>"
curl -sS -X POST "http://localhost:3460/v1/account-wallets/$AW_ID/fund" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":10}'
```

### 4. Create virtual wallet

```bash
curl -sS -X POST http://localhost:3460/v1/virtual-wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "account_wallet_id":"'"$AW_ID"'",
    "agent_slug":"research",
    "period_allowance":2,
    "max_transaction":0.5,
    "allowlist":["api.example.com"]
  }'
```

Save the returned `api_key` (`lomi_vw_*`). It is shown only once.

### 5. Agent pay

```bash
VW_KEY="<lomi_vw_...>"
curl -sS -X POST http://localhost:3460/v1/pay \
  -H "Authorization: Bearer $VW_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: pay-001' \
  -d '{"amount":0.25,"destination":"api.example.com/inference"}'
```

Rejections return machine-readable `error.code` (for example `period_allowance_exceeded`).

### Public resolve

```bash
curl -sS http://localhost:3460/v1/handles/demo
```

## Data

SQLite database at `data/wallets.sqlite` (gitignored). Reset by deleting the file.

## Integration

See [docs/LOMI-INTEGRATION-CONTRACT.md](docs/LOMI-INTEGRATION-CONTRACT.md) for future mapping to core lomi. (spec only).

## License

MIT
