## Learned User Preferences

- Do not commit changes unless the user explicitly asks.
- Do not import PI-SPI via subpath or deep imports (`@pi-spi/qrcode`, `pi-spi-sdk/qrcode`); consume PI-SPI only through the `pi-spi-sdk` package entrypoint, with dashboard QR generation routed through the API (`sdk.qr.payload` / `sdk.qr.svg`).
- `apps/api` must depend on `pi-spi-sdk` from the npm registry, not `file:../sdks/pi-spi-sdk`, to avoid Railway/Render deployment failures.
- Fold new Supabase schema into canonical numbered migrations (`20240828000002_db.sql` for tables, topic-specific files for RPCs/RLS) instead of standalone dated migration files or `run_to_prod.sql` hotfixes.

## Learned Workspace Facts

- `pi-spi-sdk` source lives in git submodule `apps/sdks/pi-spi-sdk` (`lomiafrica/pi-spi-sdk`); the npm package `pi-spi-sdk` is owned by `princemuichkine` — publishing requires that account or being added as a maintainer.
- Dashboard `.vercelignore` must not use a broad `supabase/` pattern; exclude only DB artifact paths (`/supabase/migrations/`, `/supabase/.temp/`, `/supabase/docs/`, `/supabase/seed.sql`) so `/supabase/functions/` and `src/lib/supabase/` remain available at Vercel build time.
- Agent-driven merchant onboarding is exposed at `/provisioning/v1/*` in `apps/api` with `lomi_prov_*` platform keys; MCP reads `LOMI_PROVISIONING_KEY` and registers a separate provisioning tools manifest from `agent-openapi.json`; provisioned merchants become real accounts via onboarding RPCs.
- Platform admin UI (KYC review, provisioning monitoring) lives in `apps/admin` (Vite + React Router at `admin.lomi.africa`), gated by `is_platform_admin()` + `@lomi.africa` email via `get_admin_*` RPCs — not in `apps/dashboard`.
- `apps/dashboard` is the merchant-facing Vite + React Router SPA (`dashboard.lomi.africa`), not Next.js; auth is client-side Supabase.
- Partner API at `/partners/v1/*` uses `lomi_partner_*` management keys (`apps/api/src/partners/`); partner and OAuth routes are included in `agent-openapi.json`.
- MCP agent OAuth self-service: authorization server in `apps/api`, MCP acts as OAuth resource server validating `lomi_oat_*` via HTTP introspection only (no private `apps/api` imports into `apps/mcp`); user consent at dashboard `/connect/agent-connect`.
- Agent discovery surfaces: `/agent/capabilities`, `agent-openapi.json`, `.well-known/agent.json`; curated `llms.txt` includes an agent-onboarding section pointing at `build/mcp`.
