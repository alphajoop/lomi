# WooCommerce local dev (Docker)

Quick start for plugin development. Full checklist: [DEV-ENV.md](../../DEV-ENV.md).

```bash
cd dev/woocommerce
docker compose up -d
```

1. Open http://localhost:8080 and finish WordPress setup.
2. Install **WooCommerce** (Plugins → Add New, or WP-CLI below).
3. Activate **lomi. for WooCommerce** (`woo-lomi`).
4. Expose HTTPS with **Cloudflare Tunnel** (see DEV-ENV.md).
5. Configure sandbox keys in Woo + [dashboard.lomi.africa](https://dashboard.lomi.africa).

### WP-CLI (optional)

```bash
docker compose exec wordpress bash -c \
  'curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && chmod +x wp-cli.phar && mv wp-cli.phar /usr/local/bin/wp'

docker compose exec wordpress wp plugin install woocommerce --activate --allow-root
```
