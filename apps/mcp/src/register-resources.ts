import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolsManifest } from './manifest.js';
import { buildServerInstructions } from './server-instructions.js';

const GETTING_STARTED = buildServerInstructions('http');

const ERRORS_DOC = `# lomi. MCP tool result format

Tool responses are JSON text with this envelope:

\`\`\`json
{
  "ok": true,
  "status": 200,
  "statusText": "OK",
  "contentType": "application/json",
  "body": { }
}
\`\`\`

When \`ok\` is false, an \`error\` object is included:

\`\`\`json
{
  "ok": false,
  "status": 404,
  "error": {
    "kind": "lomi_http_error",
    "status": 404,
    "body": { }
  }
}
\`\`\`

Use list endpoints with query filters before calling destructive tools.
`;

const AUTH_DOC = `# lomi. MCP authentication

Every merchant tool call is scoped to the organization behind the key you present.

## Ways to authenticate
- **Browser OAuth (hosted, recommended):** add the hosted MCP URL (\`https://mcp.lomi.africa/mcp\`) with no headers. OAuth-capable clients open a Connect-with-lomi. consent flow and send \`Authorization: Bearer lomi_oat_*\` afterwards.
- **Merchant secret key (HTTP):** send \`x-lomi-api-key: <key>\` (or \`x-api-key: <key>\`) on MCP session initialize.
- **Merchant secret key (stdio):** set \`LOMI_SECRET_KEY\` (or \`X_API_KEY\`) in the server environment.
- **Provisioning key:** the \`*_provisioning_*\` tools require \`x-lomi-provisioning-key\` (HTTP) or \`LOMI_PROVISIONING_KEY\` (env). These onboard a brand-new merchant and are separate from merchant keys.

## Test vs live
- Test keys look like \`lomi_sk_test_*\`; live keys like \`lomi_sk_*\`.
- Use the sandbox base URL (\`https://sandbox.api.lomi.africa\`) with test keys before going live.

Get a key from the dashboard: **Developers → API keys → Connect MCP**.
`;

const IDEMPOTENCY_DOC = `# Idempotency

Every write tool (create/update/delete) accepts an optional \`idempotency_key\`.

- Send a **fresh unique value (UUID)** per logical operation.
- Retrying with the **same key and same arguments** safely returns the original result instead of performing the action twice.
- Always set it on money-moving tools (create refund, create payout, create payment link/request, create checkout session) so a network retry never double-charges or double-pays.

If you retry with the same key but different arguments, the API rejects the mismatch rather than guessing.
`;

const PAGINATION_DOC = `# Listing, filtering, and pagination

- \`list_*\` tools accept query-parameter filters. Inspect a tool's \`inputSchema\` to see exactly which filters it supports (commonly status, customer, currency, date range, and a limit/cursor).
- Prefer narrowing with a \`list_*\` tool (e.g. by status or customer) before fetching a single record with a \`get_*\` tool or calling a destructive tool.
- Use \`lomi_search_tools\` with a keyword when the tool you need is not already loaded.
- Read the \`lomi://tools/index\` resource for the full catalog grouped by area.
`;

/** Resolve a tool name by its stable OpenAPI operation key (rename-proof). */
function nameFor(manifest: ToolsManifest, operationKey: string): string {
  return (
    manifest.tools.find((t) => t.operationKey === operationKey)?.name ??
    operationKey
  );
}

function buildWebhooksDoc(manifest: ToolsManifest): string {
  const create = nameFor(manifest, 'POST /webhooks');
  const test = nameFor(manifest, 'POST /webhooks/{id}/test');
  const listDeliveries = nameFor(manifest, 'GET /webhook-delivery-logs');
  const getDelivery = nameFor(manifest, 'GET /webhook-delivery-logs/{id}');
  const retry = nameFor(manifest, 'POST /webhooks/{webhookId}/logs/{logId}/retry');
  const update = nameFor(manifest, 'PATCH /webhooks/{id}');
  const remove = nameFor(manifest, 'DELETE /webhooks/{id}');
  return `# Webhooks

Receive event notifications (payments, subscriptions, disputes) at your own URL.

1. **Register:** \`${create}\` with the target URL and the events to subscribe to. It returns a signing secret — store it and verify the signature on every incoming request.
2. **Verify reachability:** \`${test}\` sends a sample event to the endpoint.
3. **Debug deliveries:** \`${listDeliveries}\` / \`${getDelivery}\` show attempts with response status; \`${retry}\` re-sends a failed delivery.
4. **Maintain:** \`${update}\` changes the URL or subscribed events; \`${remove}\` stops notifications.

Always verify the signature and treat delivery as at-least-once (handle duplicates idempotently).
`;
}

function buildMoneyDoc(manifest: ToolsManifest): string {
  const balance = nameFor(manifest, 'GET /accounts/balance');
  const checkBalance = nameFor(manifest, 'GET /accounts/balance/check/{currency}');
  const payout = nameFor(manifest, 'POST /payouts');
  const settlements = nameFor(manifest, 'GET /settlements');
  const settlementTx = nameFor(manifest, 'GET /settlements/{id}/transactions');
  const checkout = nameFor(manifest, 'POST /checkout-sessions');
  const link = nameFor(manifest, 'POST /payment-links');
  return `# Money, currency, and reconciliation

- **Currencies** are ISO 4217 codes (e.g. \`XOF\`). Follow each tool's \`inputSchema\` for the amount field and its unit — do not assume a fixed convention across currencies.
- **Before paying out:** check funds with \`${balance}\` (all currencies) or \`${checkBalance}\` (one currency), then call \`${payout}\`.
- **Reconciliation:** \`${settlements}\` lists settlement periods; each \`settlement_id\` is \`{currency}:{YYYY-MM-DD}\` (UTC). \`${settlementTx}\` lists the transactions inside one period so you can tie a payout to underlying payments.
- **Collecting money as an agent:** use \`${checkout}\` (hosted checkout) or \`${link}\` (shareable link) and hand the returned URL to the customer. Direct charge endpoints are intentionally **not** exposed here because they require client-side card collection or an interactive end-user prompt.
`;
}

function buildRecipesDoc(manifest: ToolsManifest): string {
  const n = (key: string) => nameFor(manifest, key);
  return `# Common workflows (recipes)

Task-oriented sequences. Pass \`idempotency_key\` on every write. Use \`lomi_search_tools\` if a tool is not loaded.

## Collect a one-time payment
1. \`${n('POST /checkout-sessions')}\` (or \`${n('POST /payment-links')}\` for a reusable link) with an amount/currency or a product.
2. Share the returned URL with the customer.
3. Confirm payment with \`${n('GET /checkout-sessions/{id}')}\` or \`${n('GET /transactions')}\`.

## Bill one specific customer
1. \`${n('POST /customers')}\` (or find them with \`${n('GET /customers')}\`).
2. \`${n('POST /payment-requests')}\` for that customer and amount; send them the payable link.

## Start a subscription
1. \`${n('GET /products')}\` (or \`${n('POST /products')}\` first) to pick a plan.
2. \`${n('POST /checkout-sessions')}\` referencing the product to collect the first payment and enroll.
3. Manage later with \`${n('GET /subscriptions/customer/{customerId}')}\`, \`${n('POST /subscriptions/{id}/change-plan')}\`, \`${n('POST /subscriptions/{id}/cancel')}\`, \`${n('POST /subscriptions/{id}/uncancel')}\`.

## Issue a refund
1. \`${n('GET /transactions')}\` to find the payment.
2. \`${n('POST /refunds')}\` with the transaction id and an optional partial amount.

## Pay out funds
1. \`${n('GET /accounts/balance')}\` / \`${n('GET /accounts/balance/check/{currency}')}\` to confirm available funds.
2. \`${n('POST /payouts')}\` for the amount and currency.

## Set up webhooks
1. \`${n('POST /webhooks')}\` with URL + events (store the signing secret).
2. \`${n('POST /webhooks/{id}/test')}\`, then verify with \`${n('GET /webhook-delivery-logs')}\`.

## Investigate a failed payment
1. \`${n('GET /transactions')}\` (filter by status/customer/date).
2. \`${n('GET /transactions/{id}')}\` for detail. Do not refund or cancel until the root cause is clear.
`;
}

function buildToolsIndex(manifest: ToolsManifest): string {
  const byTag = new Map<string, Array<{ name: string; title: string; write: boolean }>>();
  for (const tool of manifest.tools) {
    const tag = tool.tags[0] ?? 'Other';
    const list = byTag.get(tag) ?? [];
    list.push({ name: tool.name, title: tool.title, write: tool.write });
    byTag.set(tag, list);
  }
  const tags = [...byTag.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, tools]) => ({
      tag,
      tools: [...tools].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  return JSON.stringify({ toolCount: manifest.toolCount, tags }, null, 2);
}

type MarkdownResource = {
  name: string;
  uri: string;
  title: string;
  description: string;
  text: string;
};

export function registerLomiResources(
  server: McpServer,
  manifest: ToolsManifest,
): void {
  const markdownResources: MarkdownResource[] = [
    {
      name: 'getting-started',
      uri: 'lomi://docs/getting-started',
      title: 'lomi. MCP getting started',
      description: 'Authentication, base URLs, and usage conventions.',
      text: GETTING_STARTED,
    },
    {
      name: 'authentication',
      uri: 'lomi://docs/authentication',
      title: 'lomi. MCP authentication',
      description: 'OAuth, merchant keys, provisioning keys, and test vs live.',
      text: AUTH_DOC,
    },
    {
      name: 'idempotency',
      uri: 'lomi://docs/idempotency',
      title: 'lomi. idempotency',
      description: 'How and when to pass idempotency_key on write tools.',
      text: IDEMPOTENCY_DOC,
    },
    {
      name: 'pagination',
      uri: 'lomi://docs/pagination',
      title: 'lomi. listing and filtering',
      description: 'Filtering, pagination, and tool discovery conventions.',
      text: PAGINATION_DOC,
    },
    {
      name: 'webhooks',
      uri: 'lomi://docs/webhooks',
      title: 'lomi. webhooks',
      description: 'Register, test, verify, and debug webhook endpoints.',
      text: buildWebhooksDoc(manifest),
    },
    {
      name: 'money',
      uri: 'lomi://docs/money',
      title: 'lomi. money and reconciliation',
      description: 'Currency, balances, payouts, and settlement reconciliation.',
      text: buildMoneyDoc(manifest),
    },
    {
      name: 'recipes',
      uri: 'lomi://docs/recipes',
      title: 'lomi. common workflows',
      description: 'End-to-end task recipes referencing the right tools.',
      text: buildRecipesDoc(manifest),
    },
    {
      name: 'errors',
      uri: 'lomi://docs/errors',
      title: 'lomi. tool result format',
      description: 'How to interpret ok/status/body envelopes from tool calls.',
      text: ERRORS_DOC,
    },
  ];

  for (const resource of markdownResources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: 'text/markdown',
      },
      async () => ({
        contents: [
          {
            uri: resource.uri,
            mimeType: 'text/markdown',
            text: resource.text,
          },
        ],
      }),
    );
  }

  const toolsIndexJson = buildToolsIndex(manifest);

  server.registerResource(
    'tools-index',
    'lomi://tools/index',
    {
      title: 'lomi. tools index',
      description: 'All MCP tools grouped by OpenAPI tag.',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'lomi://tools/index',
          mimeType: 'application/json',
          text: toolsIndexJson,
        },
      ],
    }),
  );
}
