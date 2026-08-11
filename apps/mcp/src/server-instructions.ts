import { getLomiApiBaseUrl } from './env-config.js';

export type InstructionMode = 'stdio' | 'http';

/**
 * Shared MCP server instructions for stdio and HTTP transports.
 */
export function buildServerInstructions(mode: InstructionMode): string {
  const baseUrl = getLomiApiBaseUrl();
  const lines = [
    'lomi. merchant REST API exposed as MCP tools.',
    `Default API base URL: ${baseUrl}. Override with LOMI_API_URL (sandbox: https://sandbox.api.lomi.africa).`,
    '',
    'Authentication:',
    mode === 'http'
      ? '- Browser OAuth (recommended): add the hosted MCP URL with no headers; OAuth-capable clients open Connect with lomi. automatically.'
      : '',
    mode === 'http'
      ? '- Merchant key: x-lomi-api-key or x-api-key on MCP session initialize (alternative to OAuth).'
      : '- Merchant key: LOMI_SECRET_KEY or X_API_KEY in server environment.',
    mode === 'http'
      ? '- OAuth access tokens (lomi_oat_*) are accepted as Authorization: Bearer after browser consent.'
      : '',
    mode === 'http'
      ? '- Your API key alone unlocks the hosted endpoint; a shared transport secret (Authorization Bearer LOMI_MCP_BEARER_TOKEN) is optional/legacy.'
      : '',
    '',
    'Best practices:',
    '- Pass idempotency_key on all write operations for safe retries.',
    '- Prefer list/filter tools before destructive operations.',
    '- Use lomi_search_tools to discover tools by keyword.',
    '- To collect money, prefer checkout-sessions / payment-links; direct charge tools are intentionally not exposed.',
    '- Resources: lomi://docs/recipes (workflows), lomi://docs/authentication, lomi://docs/idempotency, lomi://docs/pagination, lomi://docs/webhooks, lomi://docs/money, lomi://docs/errors, lomi://tools/index.',
    '- Tool results use { ok, status, body } JSON; errors include an error object when ok is false.',
  ].filter(Boolean);

  return lines.join('\n');
}
