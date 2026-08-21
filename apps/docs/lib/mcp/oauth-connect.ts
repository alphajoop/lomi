/* @proprietary license */

/** Hosted MCP URL used for OAuth-capable client installs (no API key headers). */
export const MCP_OAUTH_ENDPOINT = 'https://mcp.lomi.africa/mcp';

export const MCP_SERVER_NAME = 'lomi';

export type McpOauthClientId = 'cursor' | 'claude' | 'opencode' | 'codex';

/** UTF-8 safe base64url used by Cursor deeplinks. */
export function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** One-click Cursor install (`cursor://…/mcp/install`) with URL-only OAuth config. */
export function buildCursorOauthDeeplink(
  mcpUrl: string = MCP_OAUTH_ENDPOINT,
): string {
  const config = { url: mcpUrl };
  const encoded = base64UrlEncode(JSON.stringify(config));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${MCP_SERVER_NAME}&config=${encoded}`;
}

/** Claude Code CLI: remote HTTP; client runs OAuth on connect. */
export function buildClaudeOauthCommand(
  mcpUrl: string = MCP_OAUTH_ENDPOINT,
): string {
  return `claude mcp add --transport http ${MCP_SERVER_NAME} ${mcpUrl}`;
}

/** OpenCode CLI: remote URL; run `opencode mcp auth lomi` if prompted. */
export function buildOpenCodeOauthCommand(
  mcpUrl: string = MCP_OAUTH_ENDPOINT,
): string {
  return `opencode mcp add ${MCP_SERVER_NAME} --url ${mcpUrl}`;
}

/** OpenCode manual block: add + browser auth. */
export function buildOpenCodeManualCommands(
  mcpUrl: string = MCP_OAUTH_ENDPOINT,
): string {
  return `${buildOpenCodeOauthCommand(mcpUrl)}\nopencode mcp auth ${MCP_SERVER_NAME}`;
}

/** Codex CLI: remote HTTP; OAuth login starts when discovery succeeds. */
export function buildCodexOauthCommand(
  mcpUrl: string = MCP_OAUTH_ENDPOINT,
): string {
  return `codex mcp add ${MCP_SERVER_NAME} --url ${mcpUrl}`;
}

/** Codex manual block: add + login. */
export function buildCodexManualCommands(
  mcpUrl: string = MCP_OAUTH_ENDPOINT,
): string {
  return `${buildCodexOauthCommand(mcpUrl)}\ncodex mcp login ${MCP_SERVER_NAME}`;
}

export const CLAUDE_CONNECTORS_URL = 'https://claude.ai/customize/connectors';
