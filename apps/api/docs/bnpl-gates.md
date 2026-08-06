# BNPL (SPI débit différé) — product gates

BNPL in lomi. is **native SPI deferred debit** on **XOF** only. It is not a third-party BNPL integration (Klarna, Affirm, etc.).

## Naming

| Surface | Code | Notes |
| --- | --- | --- |
| Checkout / channels UI | Provider `JUMBO`, method `BNPL` | Marketing label; distinct from `apps/jumbo` (MPOS) |
| Ledger (merchant payout tx) | Provider `JUMBO`, method `BNPL` | Aligns with `payment_methods` FK |
| Installment collection | SPI RTPs with `spi_debit_differe = true` | E-commerce category `521` + `remise` (OpenAPI BNPL examples) |

## Merchant enablement (Jumbo opt-in)

BNPL is **not** connected by `connect_default_providers` (SPI/STRIPE/GIM only). A merchant must have:

1. SPI connected and a provisioned SPI receive account (`accounts.is_spi_account`).
2. **JUMBO** channel connected in Payment Channels (also sets `bnpl_configurations.is_active`).
3. Active XOF row in `bnpl_configurations`.

**Default:** all orgs are off (`is_active = false`, JUMBO disconnected) until a merchant connects Jumbo.

Enforced in SQL via `assert_bnpl_merchant_eligible` on `create_bnpl_plan_with_spi` and `get_bnpl_checkout_display`. Checkout calls `GET /checkout/v1/bnpl/eligibility`.

## Product scope (v1)

- **One-time** catalog products with **standard** fixed prices only.
- **Not** subscriptions, usage/metered (`billing_interval = unit`), pay-what-you-want, tiered/volume pricing, or multi-item carts.
- SQL: `assert_bnpl_eligible_product`; checkout hides BNPL when ineligible.

## Pricing (v1)

- Customer pays the **checkout product amount** split into N installments (no customer financing markup).
- Merchant **processing fee** comes from the org fee schedule (`calculate_transaction_fee` for `JUMBO` + `BNPL`), not from `bnpl_configurations` percentage fields.

## Customer eligibility

No pre-check API in pi-spi-sdk. First deferred RTP may return `statutRaison` **AG03** (not authorized), **AM14** (over plafond), or **BE23** (invalid alias). Checkout maps these to payer-facing copy and suggests instant SPI / card / mobile money.

## Ops gates (before live traffic)

1. **Capital / float** — Merchant is credited net of BNPL processing fee when the plan is created (`update_balances_for_transaction`). Platform carries installment collection risk until SPI debits complete.
2. **SPI authorization** — Payer must be authorized for deferred debit; rejections include AG03 / AM14 (see SPI core migration comments).
3. **Regulatory** — BNPL is a Phase 3 financial product in `apps/dashboard/strategy.md`; enable per org only after legal sign-off.

## Technical defaults

- Default terms: `bnpl_configurations` per org (seeded on org create via `ensure_bnpl_configuration`, inactive until Jumbo connect).
