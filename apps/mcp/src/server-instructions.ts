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
      ? '- Merchant key: x-lomi-api-key or x-api-key on MCP session initialize (required for tool calls).'
      : '- Merchant key: LOMI_SECRET_KEY or X_API_KEY in server environment.',
    mode === 'http'
      ? '- Your API key alone unlocks the hosted endpoint; a shared transport secret (Authorization Bearer LOMI_MCP_BEARER_TOKEN) is optional/legacy.'
      : '',
    '',
    'Best practices:',
    '- Pass idempotency_key on all write operations for safe retries.',
    '- Prefer list/filter tools before destructive operations.',
    '- Use lomi_search_tools to discover tools by keyword.',
    '- Read lomi://docs/getting-started and lomi://tools/index resources for context.',
    '- Tool results use { ok, status, body } JSON; errors include an error object when ok is false.',
  ].filter(Boolean);

  return lines.join('\n');
}
