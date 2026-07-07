# Plugin development environments

Documents what contributors need to run and test lomi. e-commerce plugins locally. Parent epic: [lomi. #45](https://github.com/lomiafrica/lomi./issues/45) · issue **#44**.

No production store is required — use **lomi. sandbox (test mode)** and a local or staging shop.

## Access checklist

| Item | Who provides | Notes |
| --- | --- | --- |
| GitHub org access | lomi. team | Required for private submodules: `shopify`, `bubble` |
| lomi. sandbox org | You or team | [dashboard.lomi.africa](https://dashboard.lomi.africa) — **test** secret key + webhook signing secret |
| HTTPS tunnel | You | Cloudflare Tunnel (or ngrok) so lomi. can POST webhooks to your machine |
| Submodule clone | You | `git clone --recursive` or `git submodule update --init --recursive` |

Never commit API keys, webhook secrets, or tunnel tokens to git.

---

## WooCommerce (Docker + Cloudflare Tunnel)

Recommended setup used for manual E2E and plugin UX work.

### Stack

- **Docker Compose**: WordPress + MySQL 8 ([`dev/woocommerce/docker-compose.yml`](./dev/woocommerce/docker-compose.yml))
- **Plugin**: bind-mount `woo/` submodule → `wp-content/plugins/woo-lomi`
- **Store URL (local)**: http://localhost:8080
- **Public HTTPS**: Cloudflare Tunnel → same WordPress instance
- **lomi.**: sandbox API (`https://sandbox.api.lomi.africa`), test mode ON in Woo settings

### Start

```bash
cd dev/woocommerce
docker compose up -d
```

1. Complete WordPress install in the browser.
2. Install and activate **WooCommerce** (9.6+).
3. Activate **lomi. for WooCommerce**.
4. In WooCommerce → Settings → Payments → **lomi.**: enable gateway, **test mode**, paste test secret key + test webhook secret.
5. Copy the **webhook URL** from Woo settings into dashboard → **Developers → Webhooks** (events: `PAYMENT_SUCCEEDED`, `REFUND_COMPLETED` recommended).

### Cloudflare Tunnel

Expose port **8080** so webhooks reach WordPress:

```bash
# Quick tunnel (ephemeral URL)
cloudflared tunnel --url http://localhost:8080
```

Or use a named tunnel + `config.yml` if you have a fixed hostname.

**Important:** In WordPress **Settings → General**, set **Site Address (URL)** to your public tunnel URL when testing checkout return URLs and webhooks. If the site URL stays `http://localhost:8080`, redirects after payment may break for external services.

### Plugin from zip instead of bind-mount

```bash
cd woo
pnpm install
pnpm run release
# Upload dist/woo-lomi.zip via Plugins → Add New → Upload
```

### Manual E2E

Follow [E2E.md](./E2E.md) → WooCommerce section after the environment is up.

### Automated checks (no Docker required)

```bash
./scripts/verify-lomi-plugins.sh
```

CI runs the same script on pull requests.

---

## PrestaShop

- Module folder: `prestashop/lomi/` — zip **`lomi/`** only (root of archive = `lomi/`).
- Local: Docker or native PrestaShop 1.7+ / 8.x, currency EUR/USD/XOF, HTTPS for webhooks.
- See [prestashop/lomi/README.md](prestashop/lomi/README.md) and [E2E.md](./E2E.md).

---

## Magento 2

- Package: `lomi/magento2-payments` — **not on Packagist**; use Composer VCS or copy to `app/code/Lomi/Payments/`.
- Docker dev stack: [`magento/dev`](magento/dev) (see submodule README).
- Webhooks need a public HTTPS URL (Cloudflare Tunnel or ngrok).
- See [E2E.md](./E2E.md).

---

## Shopify

- Custom install app — no zip. Enable in dashboard → **Settings → Payment channels → Integrations**.
- Requires org access to private `shopify` submodule.
- See [docs: Shopify](https://docs.lomi.africa/build/ecommerce-extensions/shopify).

---

## Bubble

- Plugin project in `bubble` submodule (private repo).
- CI: JSON validation + `scripts/smoke-test.mjs` on release workflow.
- See [E2E.md](./E2E.md) and submodule README.

---

## What to request from the team

If you are blocked, ask for:

1. **Sandbox** lomi. org with test API key and webhook secret confirmed.
2. **GitHub** access to private plugin repos you need (Shopify, Bubble).
3. **Shared staging** shop (optional) — not required if Docker + tunnel works for Woo.

---

## Related docs

- [E2E.md](./E2E.md) — manual smoke matrix per platform
- [docs.lomi.africa — E‑commerce](https://docs.lomi.africa/build/ecommerce-extensions)
- [verify-lomi-plugins.sh](./scripts/verify-lomi-plugins.sh) — static contract gate
