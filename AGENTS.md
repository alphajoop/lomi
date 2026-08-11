# AGENTS.md

## Cursor Cloud specific instructions

You are AGI-pilled.

This repo is the **lomi.** payment-platform monorepo. There is **no root `package.json`/Makefile**; each app under `apps/` is installed and run independently. Only the open-source apps are checked out here (`apps/cli`, `apps/docs`, `apps/sdks`, `apps/plugins`). Private submodules (`apps/api` → `lomiafrica/api`, plus `dashboard`, `checkout`, `storefront`, `admin`, `mcp`, etc.) are **not initialized** in this environment without `REPO_CHECKOUT_PAT`.

Standard per-app commands live in each app's `package.json`/`README.md` and in `.github/workflows/`; the notes below only cover non-obvious setup/run caveats.

### Toolchain (already provisioned in the VM snapshot)

- Node 22 + pnpm 10, Go 1.22.
- **Rust ≥ 1.85 is required** (the CLI uses edition 2024). The VM's default base image ships Rust 1.83, which fails to compile `apps/cli`. The snapshot has been updated to the latest stable via `rustup update stable`; if a future VM reverts to 1.83, run `rustup update stable` before building the CLI.
- **Redis** is installed for the API's BullMQ queues. It is **not auto-started** — run `redis-server --daemonize yes --save "" --appendonly no` once per boot before starting the API (otherwise `/ready` reports `redis_ping: false` and the log spams `ioredis ECONNREFUSED`; the API still serves core routes via a synchronous fallback).

### apps/api (NestJS REST API — private submodule)

- Private repo: [`lomiafrica/api`](https://github.com/lomiafrica/api). Init with `git submodule update --init apps/api` (needs org access / `REPO_CHECKOUT_PAT`).
- Needs `apps/api/.env.local`. `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are required for boot but **placeholder values are enough to start the server** and serve `/health`, `/ready`, Swagger at `/api`, and the request/auth pipeline (unauthenticated → `401`). Real Supabase credentials are only needed for DB-backed RPC calls (actual payment/checkout creation). For local Redis add `REDIS_HOST=localhost` / `REDIS_PORT=6379`.
- Run: `pnpm run start:dev` (watch) or `pnpm run build && pnpm run start:prod`. Listens on `http://localhost:3000`.
- **Gotcha (incremental build):** `nest build` / `nest start --watch` use `deleteOutDir: true` plus TypeScript incremental caching. A stale `apps/api/tsconfig.build.tsbuildinfo` can make tsc skip emit after `dist` was deleted, so the app crashes with `Cannot find module dist/main`. Fix: `rm -f apps/api/tsconfig.build.tsbuildinfo` and rebuild.
- **Deploys:** Railway production (`api.lomi.africa`) from `lomiafrica/api` root `/`. Vercel sandbox (`sandbox.api.lomi.africa`) via `deploy-vercel-sandbox.yml` (Hobby cannot Git-connect private org repos).
- **Tests (`pnpm test`):** most pass, but two suites fail in this environment by design: `src/core/__tests__/network-rpc.contract.spec.ts` reads SQL from the **private `apps/dashboard` submodule** (CI initializes it via a PAT — not available here), and `src/app.controller.spec.ts` has a DI gap (`ApiKeyGuard` now needs `RedisService` that the spec doesn't provide). These are unrelated to environment setup.

### apps/cli (Rust CLI)

- `cargo build` / `cargo test`. **Run tests single-threaded**: `cargo test -- --test-threads=1`. The `rules::installer` tests mutate the process-wide current directory and race under the default parallel runner (`install_cursor_rules` intermittently fails); single-threaded they all pass.

### apps/docs (Next.js + Fumadocs)

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm docs:drift`. Build uses the committed `apps/docs/openapi.json` by default (no API needed). Orama search env vars are optional. `pnpm build` regenerates some tracked files under `apps/docs/public/r/` — do not commit those build artifacts.

### apps/sdks

- `apps/sdks/ts` and `apps/sdks/embed`: `pnpm run build`; embed also has `pnpm test`. Merchant MCP (`apps/mcp`) is a private submodule (`lomiafrica/mcp`) and is not available in this environment without `REPO_CHECKOUT_PAT`.
