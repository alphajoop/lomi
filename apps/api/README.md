# lomi. API

RESTful API service for the lomi. payment platform.

## Overview

NestJS API for payments, subscriptions, webhooks, and metering.

| Environment | Platform | Config |
|-------------|----------|--------|
| **Production** | [Railway](https://railway.app) (long-running process) | [`Dockerfile`](Dockerfile), [`railway.json`](railway.json) |
| **Sandbox** | [Vercel](https://vercel.com) (serverless) | [`vercel.json`](vercel.json) |

Production Railway conventions match [`apps/mcp`](../mcp): `/health`, `/ready`.

Frontends (dashboard, checkout, docs, storefront) stay on Vercel.

## Quick start (local)

```bash
cd apps/api
pnpm install
cp .env.example .env.local
pnpm run start:dev
```

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `GET /ready` | Readiness (Railway health check) |
| `GET /health/redis` | Redis + queue snapshot |
| `GET /api` | Swagger UI |

## Deployment

### Production (Railway)

| Setting | Value |
|---------|--------|
| Root directory | `.` (repository root) |
| Dockerfile | `apps/api/Dockerfile` |
| Git submodules | **Enabled** (`apps/pi-spi-sdk` is a submodule) |
| Start command | `node dist/main` (see [`../../railway.json`](../../railway.json)) |
| Health check path | `/health` |
| Health check timeout | 120s |
| Node version | 22 |

The API depends on [`pi-spi-sdk`](../pi-spi-sdk) via `file:../pi-spi-sdk`; the Docker build copies `apps/pi-spi-sdk` from the monorepo root context.

Config: [`../../railway.json`](../../railway.json). Env vars: [`.env.example`](.env.example).

```bash
pnpm run smoke:http https://your-service.up.railway.app
```

### Sandbox (Vercel)

| Setting | Value |
|---------|--------|
| Root directory | `apps/api` |
| Framework | Other (`@vercel/node` via [`vercel.json`](vercel.json)) |

Vercel ignores Railway/Docker files; Railway ignores `vercel.json`.

## Documentation

- [API reference](https://docs.lomi.africa/api)
- [Getting started](https://docs.lomi.africa/start/integration-journey)

## Support

[hello@lomi.africa](mailto:hello@lomi.africa)
