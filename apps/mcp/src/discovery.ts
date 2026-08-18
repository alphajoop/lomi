import type { ToolsManifest } from './manifest.js';
import {
  getMcpResourceUrl,
  getOAuthIssuer,
  getProtectedResourceMetadataUrl,
} from './oauth-introspection.js';

export function buildMcpServerCard(manifest: ToolsManifest) {
  return {
    name: 'io.lomi/mcp',
    version: manifest.apiVersion,
    title: 'lomi.',
    description:
      'Payment infrastructure for francophone West Africa: hosted checkout, Mobile Money, cards, payouts, subscriptions, and developer APIs across UEMOA.',
    websiteUrl: 'https://lomi.africa',
    repository: {
      url: 'https://github.com/lomiafrica/lomi.',
      source: 'github',
    },
    remotes: [
      {
        type: 'streamable-http',
        url: getMcpResourceUrl(),
      },
    ],
    authentication: {
      oauth: {
        authorization_servers: [getOAuthIssuer()],
        protected_resource_metadata: getProtectedResourceMetadataUrl(),
      },
    },
  };
}

export function buildMcpToolsPreview(manifest: ToolsManifest) {
  return manifest.tools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description.split('\n')[0] ?? tool.title,
  }));
}

export function buildMcpWellKnown(manifest: ToolsManifest) {
  const resource = getMcpResourceUrl();
  const origin = new URL(resource).origin;
  return {
    mcp: resource,
    server_card: `${origin}/server-card`,
    catalog: `${origin}/.well-known/mcp/catalog.json`,
    authorization_server: `${getOAuthIssuer()}/.well-known/oauth-authorization-server`,
    protected_resource: getProtectedResourceMetadataUrl(),
    tools_preview: buildMcpToolsPreview(manifest),
  };
}

export function buildMcpCatalog(manifest: ToolsManifest) {
  const resource = getMcpResourceUrl();
  const origin = new URL(resource).origin;
  return {
    servers: [
      {
        name: 'io.lomi/mcp',
        version: manifest.apiVersion,
        url: `${origin}/server-card`,
      },
    ],
  };
}

export function buildAuthorizationServerPointer() {
  const issuer = getOAuthIssuer();
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    introspection_endpoint: `${issuer}/oauth/introspect`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    scopes_supported: [
      'provisioning.onboard',
      'merchant.read',
      'merchant.write',
    ],
  };
}
