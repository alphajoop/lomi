import { getLomiApiBaseUrl } from './env-config.js';

export type OAuthIntrospectionResult = {
  active: boolean;
  grant_type?: 'provisioning' | 'merchant';
  provisioning_key?: string;
  provisioning_key_id?: string;
  organization_id?: string;
  access_level?: 'read' | 'write' | 'full';
  connection_key?: string;
  exp?: number;
  scope?: string;
};

const cache = new Map<string, { result: OAuthIntrospectionResult; expiresAt: number }>();

export function looksLikeOAuthAccessToken(token: string): boolean {
  return token.trim().startsWith('lomi_oat_');
}

export async function introspectOAuthAccessToken(
  token: string,
): Promise<OAuthIntrospectionResult> {
  const trimmed = token.trim();
  const cached = cache.get(trimmed);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const baseUrl = getLomiApiBaseUrl();
  const internalKey =
    process.env.INTERNAL_API_KEY?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    '';
  if (!internalKey) {
    return { active: false };
  }

  const response = await fetch(`${baseUrl}/oauth/introspect/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': internalKey,
    },
    body: JSON.stringify({ token: trimmed }),
  });

  if (!response.ok) {
    return { active: false };
  }

  const result = (await response.json()) as OAuthIntrospectionResult;
  const ttlMs = result.exp
    ? Math.max(0, result.exp * 1000 - Date.now())
    : 60_000;
  cache.set(trimmed, {
    result,
    expiresAt: Date.now() + Math.min(ttlMs, 60_000),
  });
  return result;
}

export function getOAuthIssuer(): string {
  return (
    process.env.LOMI_OAUTH_ISSUER?.trim()?.replace(/\/$/, '') ||
    getLomiApiBaseUrl()
  );
}

export function getMcpResourceUrl(): string {
  const explicit = process.env.LOMI_MCP_RESOURCE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const port = process.env.PORT ?? process.env.LOMI_MCP_HTTP_PORT ?? '3333';
  const host = process.env.LOMI_MCP_PUBLIC_HOST?.trim() || `localhost:${port}`;
  const path =
    process.env.LOMI_MCP_HTTP_PATH?.trim() ||
    process.env.MCP_HTTP_PATH?.trim() ||
    '/mcp';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}${normalizedPath}`;
}

export function buildProtectedResourceMetadata() {
  const resource = getMcpResourceUrl();
  const issuer = getOAuthIssuer();
  return {
    resource,
    authorization_servers: [issuer],
    scopes_supported: [
      'provisioning.onboard',
      'merchant.read',
      'merchant.write',
    ],
    bearer_methods_supported: ['header'],
  };
}
