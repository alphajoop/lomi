## Learned User Preferences

- Do not commit changes unless the user explicitly asks.
- Do not import PI-SPI via subpath or deep imports (`@pi-spi/qrcode`, `pi-spi-sdk/qrcode`); consume PI-SPI only through the `pi-spi-sdk` package entrypoint, with dashboard QR generation routed through the API (`sdk.qr.payload` / `sdk.qr.svg`).
- `apps/api` must depend on `pi-spi-sdk` from the npm registry, not `file:../sdks/pi-spi-sdk`, to avoid Railway/Render deployment failures.

## Learned Workspace Facts

- `pi-spi-sdk` source lives in git submodule `apps/sdks/pi-spi-sdk` (`lomiafrica/pi-spi-sdk`); the npm package `pi-spi-sdk` is owned by `princemuichkine` — publishing requires that account or being added as a maintainer.
- Dashboard `.vercelignore` must not use a broad `supabase/` pattern; exclude only DB artifact paths (`/supabase/migrations/`, `/supabase/.temp/`, `/supabase/docs/`, `/supabase/seed.sql`) so `/supabase/functions/` and `src/lib/supabase/` remain available at Vercel build time.
- Agent-driven merchant provisioning is exposed at `/provisioning` in `apps/api` with `lomi_prov_*` platform keys; MCP reads `LOMI_PROVISIONING_KEY` and registers a separate provisioning tools manifest from `agent-openapi.json`.
