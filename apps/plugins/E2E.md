# Plugin E2E smoke matrix

Manual checklist per platform. Run in **test mode** first, then repeat critical paths in **live mode** with small amounts.

## Shared expectations

| Step | Expected |
|------|----------|
| Create checkout session | `integration_source` matches platform enum |
| XOF store | Amount sent in whole francs (not ×100) |
| Hosted checkout pay | Order marked paid / completed |
| Webhook `PAYMENT_SUCCEEDED` | HMAC verified; order completes if return URL missed |
| Test/live toggle | API base + webhook secret switch together |
| Abandon | Back from hosted checkout restores cart / pending order |

Automated suite: `./scripts/run-plugin-tests.sh` (static parity + webhook contract + Woo zip). Static-only: `./scripts/run-plugin-tests.sh --fast`

---

## WooCommerce

**Environment:** Docker Compose ([`dev/woocommerce`](./dev/woocommerce)) + **Cloudflare Tunnel** for HTTPS webhooks, or shared staging. See [DEV-ENV.md](./DEV-ENV.md).

```bash
cd dev/woocommerce && docker compose up -d
# cloudflared tunnel --url http://localhost:8080
```

1. Install WooCommerce; activate `woo-lomi` (bind-mounted from `woo/` submodule).
2. Configure test API key + test webhook secret; enable test mode.
3. Set WordPress site URL to tunnel hostname when testing checkout return + webhooks.
4. Place order → redirect to lomi. checkout → pay (sandbox).
5. Confirm order `processing`/`completed` and webhook note.
6. Toggle live keys (staging only if available); confirm `api.lomi.africa` used.
7. Start checkout, use browser Back → cart restored (abandon JS).

---

## Magento

**Environment:** [`magento/dev`](magento/dev) Docker + ngrok for webhooks.

```bash
cd apps/plugins/magento/dev
docker compose up -d
# expose https URL for webhook endpoint
```

1. `bin/magento` → enable Lomi, test mode, paste test keys.
2. Place order → hosted checkout → pay.
3. Webhook `PAYMENT_SUCCEEDED` → invoice paid.
4. Admin **Setup health** shows GET `/me` OK.
5. Abandon: back button on checkout → quote restored.
6. (Optional) Refund in dashboard → `REFUND_COMPLETED` webhook adds order comment.

Optional runtime verify:

```bash
./scripts/verify-lomi-plugins.sh --run-runtime --magento-root /path/to/magento
```

---

## PrestaShop

**Environment:** PrestaShop docker-compose in plugin repo (if present) or staging shop.

1. Configure `LOMI_MODE=1` (test), test API key + webhook secret.
2. Checkout → Pay with lomi. → hosted checkout → pay.
3. Webhook completes order if callback delayed.
4. Cancel on hosted checkout → returns to checkout step 3.
5. Abandon: browser back → session cleared, cart intact.

---

## Shopify

**Environment:** CI (`shopify-ci.yml`) + staging shop with app installed.

1. Cart checkout → draft order → lomi. session (`integration_source: shopify`).
2. Pay in hosted checkout → order marked paid in Shopify admin.
3. Confirm recent transactions in app admin (when scoped by integration).

---

## Bubble

**Environment:** Bubble app (version-test) + lomi. sandbox keys.

1. Plugins → lomi. → paste test API secret + webhook secret (Development).
2. Workflow: **Create checkout session** (with `bubble_thing_id`) → **Mark checkout redirect** → **Redirect to checkout** (or **lomi. Pay button**).
3. Pay in hosted sandbox checkout → land on `success_url` with `session_id`.
4. Success page: **Complete if paid** → if `paid`, mark Thing paid; else **Abandon checkout**.
5. Webhook API workflow: **Verify and parse webhook** → **On payment succeeded** → update Thing (idempotent).
6. Abandon: start checkout → browser Back → `lomi:checkout-abandon` / unpaid Thing.
7. Refund: webhook branch **On refund completed** → update Thing / note.
8. Confirm dashboard shows `integration_source: bubble`.

Local helpers:

```bash
LOMI_SECRET_KEY=lomi_sk_test_... node apps/plugins/bubble/scripts/smoke-test.mjs
apps/plugins/scripts/verify-lomi-plugins.sh
```

---

## Release tags

| Platform | Tag pattern | Workflow |
|----------|-------------|----------|
| Woo | `woo-v*` | `woo-release.yml` |
| Magento | `magento-v*` | `magento-release.yml` |
| PrestaShop | `prestashop-v*` | `prestashop-release.yml` |
| Bubble | `bubble-v*` | `bubble-release.yml` |
