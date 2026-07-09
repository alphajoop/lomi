import { describe, expect, it } from 'vitest';
import {
  buildProtectedResourceMetadata,
  looksLikeOAuthAccessToken,
} from '../src/oauth-introspection.js';

describe('oauth-introspection', () => {
  it('detects OAuth access tokens', () => {
    expect(looksLikeOAuthAccessToken('lomi_oat_abc')).toBe(true);
    expect(looksLikeOAuthAccessToken('lomi_prov_abc')).toBe(false);
  });

  it('builds protected resource metadata with authorization server', () => {
    process.env.LOMI_MCP_RESOURCE_URL = 'https://mcp.lomi.africa/mcp';
    process.env.LOMI_OAUTH_ISSUER = 'https://api.lomi.africa';
    const metadata = buildProtectedResourceMetadata();
    expect(metadata.resource).toBe('https://mcp.lomi.africa/mcp');
    expect(metadata.authorization_servers).toContain('https://api.lomi.africa');
    expect(metadata.scopes_supported).toContain('provisioning.onboard');
    expect(metadata.scopes_supported).toContain('merchant.read');
    expect(metadata.scopes_supported).toContain('merchant.write');
  });
});
