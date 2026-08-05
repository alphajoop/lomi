# lomi. integration contract (wallets shadow POC)

This document describes how [`apps/wallets`](../../) mirrors future lomi. concepts **without** writing to production Supabase or calling `apps/api`. It is the contract future work should follow when wiring Account and Virtual Wallets into the platform.

## Independence boundary

| Rule | Detail |
| --- | --- |
| Storage | Local SQLite only (`data/wallets.sqlite`) |
| Auth | `lomi_owner_*` sessions and `lomi_vw_*` keys local to this app |
| No imports | Do not import `apps/api`, dashboard packages, or prod RPCs |
| Publish | Separate remote `github.com/lomiafrica/wallets` like `apps/stellar` |

## Shadow POC mapping

| POC concept | Production / future analogue |
| --- | --- |
| `handles.handle` | `organizations.slug`, store handle, public `*.lomi.pay` identity |
| `account_wallets` | Org treasury `accounts` (XOF/USD/EUR), test/live split |
| `virtual_wallets` | Scoped agent credentials (OAuth connection keys, future `lomi_vw_*` or Network delegation) |
| `period_allowance_cents` | Spend cap per agent per period |
| `max_transaction_cents` | Max single payment |
| `allowlist_json` | Merchant or host allowlist for agent spend |
| `POST /v1/pay` | Future headless debit against org balance or prepaid agent budget |
| `agent_identities.fqdn` | `research.acme.lomi.pay` style optional agent attribution |
| Mock `POST .../fund` | `account_top_ups`, checkout funding, or bank wire confirm |

## Future production seam (spec only)

1. **Migration** — optional `agent_virtual_wallets` table keyed by `organization_id`, parent `accounts` row, policy JSON, period counters.
2. **API** — Nest module in `apps/api` or dedicated wallets service; never mix wallet ledger with customer `meter_balances` (usage units).
3. **MCP** — tools to create virtual wallets and pay under caps; keep separate from merchant `lomi_sk_*` full access.
4. **Identity** — DNS or well-known resolve for `handle.lomi.pay` pointing at org + agent metadata (similar to Cloudflare `cloudflare.pay`).
5. **x402 / USDC** — stay on [`apps/stellar`](../../stellar/) track; wallets v1 is fiat sandbox only.

## Optional future funding from lomi.

Documented but not implemented: owner funds Account Wallet via lomi. checkout (`LOMI_SECRET_KEY`) instead of mock top-up.

## Success criteria (POC)

Claim `demo.lomi.pay`, mock fund $10, virtual wallet $2/week and $0.50 max tx, three successful pays then rejection on overspend, zero prod API or Supabase calls.
