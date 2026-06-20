# `@lomi./mcp`

MCP server that exposes the **lomi. merchant API** to AI clients (Cursor, Claude Desktop, etc.); same public API as the REST docs, as MCP tools.

**For developers building integrations** — not for lomi. platform admin or self-hosted payment ops.

Integration guide: [docs.lomi.africa/build/mcp](https://docs.lomi.africa/build/mcp)

## Hosted MCP (HTTP)

Most teams use lomi.’s hosted server at `https://mcp.lomi.africa/mcp`.

**Headers on every MCP request:**

| What | Header |
|------|--------|
| Transport access (hosted server) | `Authorization: Bearer <transport secret from dashboard snippet>` |
| Your merchant API key (required for tool calls) | `x-lomi-api-key: <key>` or `x-api-key: <key>` |

The transport secret gates access to the shared MCP endpoint. It is **not** your merchant key — never put your API key in `Authorization` when a transport secret is required.

**Checks (optional):** `GET /health`, `GET /ready` on the same host.

Copy a ready-made config from [`examples/`](./examples/) (`cursor-http.mcp.json`, `claude-desktop-http.mcp.json`).

## stdio (local)

```bash
npx -y @lomi./mcp
```

Example Cursor / Claude Desktop config:

```json
{
  "mcpServers": {
    "lomi": {
      "command": "npx",
      "args": ["-y", "@lomi./mcp"],
      "env": {
        "LOMI_API_KEY": "your-merchant-secret-key",
        "LOMI_API_BASE_URL": "https://api.lomi.africa"
      }
    }
  }
}
```

Use `https://sandbox.api.lomi.africa` for sandbox.

## Tool discovery

Clients that support deferred loading can call **`lomi_search_tools`** with a keyword query.

MCP **resources** (`lomi://docs/getting-started`, `lomi://docs/errors`, `lomi://tools/index`) and **prompts** (`onboard_merchant`, `debug_failed_payment`, `setup_webhook`) ship with the server.

## Get a merchant key

1. **Dashboard (recommended):** **Developers → API keys → Connect MCP** — device flow or copy a secret key.
2. **Manual:** any secret API key from **Developers → API keys** in the dashboard, used as **`x-lomi-api-key`**.

## Contributing

Maintainers: see [CONTRIBUTING.md](./CONTRIBUTING.md).
