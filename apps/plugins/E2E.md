# Manual E2E smoke tests (lomi. plugins)

Parent epic: [lomi. #45](https://github.com/lomiafrica/lomi./issues/45).

Use this checklist after plugin changes or before a release. Pair with:

- [DEV-ENV.md](./DEV-ENV.md) — local stacks, tunnels, sandbox keys
- `./scripts/run-plugin-tests.sh` — automated static + webhook contract checks (CI runs the same)

**Credentials:** lomi. **sandbox** org only. Never commit API keys or `whsec_…` secrets.

---

## Pre-flight (all platforms)

| Step | Pass criteria |
|------|----------------|
| Sandbox keys | Test secret key (`lomi_sk_test_…`) + test webhook signing secret (`whsec_…`) from [dashboard.lomi.africa](https://dashboard.lomi.africa) |
| Test mode ON | Plugin uses `https://sandbox.api.lomi.africa` |
| Public HTTPS | Cloudflare Tunnel or ngrok exposes your local shop (webhooks require a reachable URL) |
| Store URL | WordPress / PrestaShop / Magento **base URL** matches the tunnel hostname (not `localhost`) when testing redirects |
| Webhook endpoint | Registered in dashboard → **Developers → Webhooks** with events **`PAYMENT_SUCCEEDED`** (+ **`REFUND_COMPLETED`** on Woo) |
| Test webhook | Dashboard “Send test webhook” → **HTTP 200** (no order created — expected) |
| Currency | Shop currency **XOF**, **USD**, or **EUR** |

**Test card (sandbox):** `4242 4242 4242 4242` — any future expiry, any CVC. More: [Sandbox payments](https://docs.lomi.africa/start/sandbox-payments).

---

## WooCommerce

**Stack:** [dev/woocommerce/docker-compose.yml](./dev/woocommerce/docker-compose.yml) (bind-mount `woo/` → `woo-lomi`).

### Setup

```bash
cd dev/woocommerce
docker compose up -d
```

1. Finish WordPress install → http://localhost:8080
2. Install and activate **WooCommerce** (9.6+)
3. Activate **lomi. for WooCommerce**
4. Start tunnel: `cloudflared tunnel --url http://localhost:8080`
5. **Settings → General** — set **Site Address (URL)** to the tunnel HTTPS URL
6. **WooCommerce → Settings → Payments → lomi.** — enable gateway, **test mode**, paste test secret key + test webhook secret
7. Copy **Webhook URL** from the settings page → dashboard webhook (events above)
8. **Setup health** panel — API connection **OK**, webhook secret **Configured**

### Checkout branding (#40)

| Check | Pass criteria |
|-------|----------------|
| Classic checkout | Payment row shows **branding card**: pay-with image, method icons (right), lock hint |
| Blocks checkout | Same card in Woo Blocks payment method (rebuild `blocks.js` after JS changes) |
| No duplicate title | Default “lomi.” title hidden when branding card is active |
| Responsive | Card spans full payment row width; icons do not overflow on mobile |

### Payment flow

| # | Action | Expected |
|---|--------|----------|
| 1 | Add product → checkout → pay with **lomi.** | Redirect to `checkout.lomi.africa` (sandbox) |
| 2 | Pay with test card | Success page on lomi. checkout |
| 3 | Return to store | Order **Processing** / **Completed** (per Woo settings) |
| 4 | Dashboard webhook log | `PAYMENT_SUCCEEDED` → **200** |
| 5 | Woo order notes / status | Payment captured; no stuck **Pending payment** |

### Admin UX (#40)

| Check | Pass criteria |
|-------|----------------|
| Copy webhook URL | **Copy URL** button copies full HTTPS webhook URL |
| Webhook events row | **Checklist** (not permanent Warning) |
| API error | Invalid key shows merchant-friendly message (not raw JSON) |
| Advanced settings | Hidden by default; toggle reveals public keys / extra fields |

### Automated (no Docker)

```bash
./scripts/run-plugin-tests.sh --fast   # static only
./scripts/run-plugin-tests.sh          # includes Woo zip build
```

---

## PrestaShop

**Stack:** [prestashop/docker-compose.yml](./prestashop/docker-compose.yml) (module baked into image from `prestashop/lomi/`).

### Setup

```bash
cd prestashop
cp local.env.sample local.env   # edit DB passwords if needed
docker compose up -d --build
```

1. Complete PrestaShop installer → http://localhost:8000
2. Enable currency **EUR** / **USD** / **XOF**; configure a **shipping carrier**
3. **Modules → lomi.** → Configure — test mode, keys, webhook secret
4. Tunnel HTTPS → update shop URL in **Shop parameters → Traffic & SEO** (or hosts file + tunnel)
5. Register webhook URL from module config in dashboard

### Checkout branding (#40)

| Check | Pass criteria |
|-------|----------------|
| Payment step | **lomi.** option shows branding card (same BEM classes as Woo) |
| Selection state | Selected payment option highlights border; radio + card aligned |
| CTA | Redirect to hosted checkout after confirming payment method |

### Payment flow

| # | Action | Expected |
|---|--------|----------|
| 1 | Cart → checkout (address + carrier) → **lomi.** | Redirect to sandbox checkout |
| 2 | Pay with test card | Return to shop and/or webhook fires |
| 3 | Order status | **Paid via lomi.** |
| 4 | Webhook | `PAYMENT_SUCCEEDED` → **200** |

**Logs:** Advanced parameters → Logs — filter `lomi`.

---

## Magento 2

**Stack:** [magento/dev](./magento/dev) (Docker, ~3 min first boot).

### Setup

```bash
cd magento/dev
cp .env.example .env   # LOMI_TEST_SK, LOMI_TEST_WEBHOOK_SECRET
docker compose up -d --build
bash setup.sh
```

1. Storefront http://localhost:8080 — admin `admin` / `Admin12345!`
2. Tunnel → set `web/unsecure/base_url` and `web/secure/base_url` to tunnel HTTPS URL
3. **Stores → Configuration → Sales → Payment Methods → lomi.** — test mode + secrets
4. Dashboard webhook: `https://YOUR-TUNNEL/lomi/payment/webhook` — `PAYMENT_SUCCEEDED`

```bash
docker compose exec --user www-data magento php app/code/Lomi/Payments/dev/check-webhook-config.php
```

### Checkout branding (#40)

| Check | Pass criteria |
|-------|----------------|
| Payment method list | Branding card with pay-with image, wide Apple/Google Pay icons, lock hint |
| Title fallback | Empty title → branding card; non-empty title → legacy text label |
| Static assets | `setup:static-content:deploy` run if images missing |

### Payment flow

| # | Action | Expected |
|---|--------|----------|
| 1 | Checkout → **lomi.** → Place order | Redirect to sandbox checkout |
| 2 | Pay with test card | Order **Processing** |
| 3 | Webhook | `PAYMENT_SUCCEEDED` → **200** `success` |
| 4 | Callback | `/lomi/payment/callback` reachable if customer returns |

Optional CLI: `dev/verify-order-session.php --apply` after a test order.

---

## Cross-platform parity (#40)

Run once per release that touches checkout UI:

| Element | Woo | PrestaShop | Magento |
|---------|-----|------------|---------|
| Root class `.wc-lomi-checkout-branding` | ✓ | ✓ | ✓ |
| `__main` / `__brand` / `__methods` layout | ✓ | ✓ | ✓ |
| Pay-with image | ✓ | ✓ | ✓ |
| Method icons (card, mobile money, Apple/Google wide) | ✓ | ✓ | ✓ |
| Lock hint “Secure hosted checkout…” | ✓ | ✓ | ✓ |

```bash
./scripts/verify-lomi-plugins.sh
```

---

## Bubble (smoke only)

Submodule may be private. When available:

```bash
node scripts/test_bubble_json.mjs
```

Manual: create session action → sandbox checkout → `LOM-parse_webhook` receives `PAYMENT_SUCCEEDED`. See submodule README.

---

## Sign-off template

Copy into PR or release notes:

```
Platform: Woo / PrestaShop / Magento
Commit: <submodule SHA>
Tunnel URL: <ephemeral — do not commit>
Date:

[ ] Pre-flight checklist
[ ] Branding card on checkout
[ ] Sandbox payment 4242…
[ ] PAYMENT_SUCCEEDED webhook 200
[ ] Order status correct
[ ] run-plugin-tests.sh green
```
