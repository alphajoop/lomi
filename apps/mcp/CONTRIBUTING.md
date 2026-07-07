# Contributing to lomi. MCP

This guide is for **lomi. maintainers and operators** deploying or developing `apps/mcp`. Integrators should use [docs.lomi.africa/build/mcp](https://docs.lomi.africa/build/mcp) and the hosted server at `https://mcp.lomi.africa`: not deploy their own instance unless they work on lomi. engineering.

## Deploy

Environment variables are listed in [`.env.example`](./.env.example).

```bash
cd apps/mcp
pnpm install
pnpm run start:http
```

See [`railway.json`](./railway.json) for Railway deployment.

Key operator settings:

- `LOMI_MCP_BEARER_TOKEN`: transport gate for HTTP MCP
- `LOMI_API_URL`: default merchant API base URL for tool calls

## Regenerate tools

After public API or allowlist changes:

```bash
cd apps/mcp
pnpm run generate
```

Commit `src/generated/tools-manifest.json` and any updated copy in `scripts/mcp-tool-copy.en.json`.

## Tests

```bash
cd apps/mcp
pnpm test
```

## Related

- [Maintaining CLI and MCP](https://docs.lomi.africa/resources/contributing/maintaining-cli-mcp), roles and boundaries
- Monorepo [CONTRIBUTING.md](https://github.com/lomiafrica/lomi./blob/master/CONTRIBUTING.md)
