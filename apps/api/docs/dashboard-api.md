# Dashboard API layer

The merchant dashboard (Vite SPA) is migrating from direct `supabase.rpc()` and edge function calls to a **dashboard-facing API** on Railway (`/dashboard/v1/*`).

## Three-tier model

| Layer | Use for | Do not use for |
|-------|---------|----------------|
| **Dashboard → API** (`/dashboard/v1`) | Reads, orchestration, permission checks in TypeScript | New `SECURITY DEFINER` RPCs callable from the browser |
| **Postgres RPC** | Atomic multi-table writes, trigger targets, heavy SQL | New CRUD/list endpoints for dashboard |
| **apps/worker** | Email, exports, renewals, PDF, long-running jobs | Synchronous dashboard requests |
| **Edge functions** | Legacy invoke targets; thin cron forwarders | New business logic |

## Auth

Dashboard routes use **Supabase session JWT** (`Authorization: Bearer <access_token>`), not API keys.

- `merchantId` is always derived from the verified JWT (`sub`), never from the request body.
- `organizationId` comes from the route or `X-Organization-Id` header after `verify_dashboard_org_access`.
- Optional `X-Environment: live|test` scopes ledger data.

Merchant OpenAPI routes (`/products`, `/transactions`, etc.) remain on **`ApiKeyGuard`** only.

## Writes and atomicity

Operations requiring atomicity (multi-table writes) **must** stay as a single PostgreSQL RPC called from the API service layer with the service role—not from the browser, and not as multiple sequential RPCs from NestJS.

## Migration template

1. Add `Dashboard*Controller` under `src/dashboard/`.
2. Reuse or extend existing services; call existing RPCs with service role during transition.
3. Add dashboard client in `apps/dashboard/src/lib/api/`.
4. Feature-flag cutover (`VITE_DASHBOARD_API_*`).
5. Remove browser RPC path when stable.

## Internal jobs

Worker and DB triggers enqueue via `POST /internal/jobs` with `x-internal-key` (`INTERNAL_API_KEY`). Do not add new hardcoded `functions/v1/*` URLs in migrations.

Use `enqueue_notification(job_type, payload)` (see `20250226000108_dashboard_org_access.sql`) for new trigger-driven work. Job types:

- `noop` — worker connectivity check
- `send-email` — transactional email via `@lomi./email` and Resend in `apps/worker`

Legacy triggers that still call `functions/v1/send-email` should be migrated to `enqueue_notification('send-email', …)` once worker is deployed in staging.
