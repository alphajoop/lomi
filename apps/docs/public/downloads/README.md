# Plugin downloads (docs.lomi.africa)

Merchant-facing zips served at `/downloads/*` — linked from docs, **not** from GitHub.

## woo-lomi.zip

| Field | Value |
| --- | --- |
| File | `woo-lomi.zip` |
| Version | 1.003.1 |
| Source | `apps/plugins/woo` after `pnpm run build && pnpm run i18n && ./scripts/release.sh` |
| Docs button | [WooCommerce guide](/build/ecommerce-extensions/woocommerce) |

### Verify before opening a docs PR

From the monorepo root (requires [doctool](https://github.com/lomiafrica/doctool) built under `apps/doctool`):

```bash
cd apps/doctool && cargo build --release -p doctool-cli
cd ../..
./apps/doctool/target/release/dt check --root .
./apps/doctool/target/release/dt sync-i18n --check --root .
```

Or in `apps/docs` only: `pnpm screenshots:verify` (WebP dimensions) and `pnpm lint`.

```bash
cd apps/plugins/woo
pnpm install --frozen-lockfile
pnpm run build && pnpm run i18n
./scripts/release.sh
cp dist/woo-lomi.zip ../../docs/public/downloads/woo-lomi.zip
```

Or after CI tag `woo-v*` on the monorepo, copy the release asset here so merchants always download from docs.

### CI (future)

On `woo-v*` release, upload the same artifact to docs CDN / `public/downloads/`.
