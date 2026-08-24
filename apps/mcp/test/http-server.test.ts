import http from 'node:http';
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';

import manifestJson from '../src/generated/tools-manifest.json' with { type: 'json' };
import { createHttpApplication } from '../src/http.js';
import { parseManifest } from '../src/manifest-parse.js';
import { isString, validateJsonValue, type JsonObject } from "@lomi./shared";

const ORIGINAL_ENV = { ...process.env };

function listen(
  app: ReturnType<typeof createHttpApplication>,
): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || isString(addr)) {
        reject(new Error('expected TCP AddressInfo'));
        return;
      }
      resolve({ server, port: addr.port });
    });
    server.on('error', reject);
  });
}

describe('createHttpApplication', () => {
  let server: http.Server | undefined;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.LOMI_MCP_ALLOWED_HOSTS = '127.0.0.1';
    delete process.env.LOMI_MCP_BEARER_TOKEN;
    delete process.env.LOMI_MCP_RATE_LIMIT_RPM;
    delete process.env.LOMI_API_URL_ALLOWLIST;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
    }
    process.env = { ...ORIGINAL_ENV };
  });

  it('GET /health returns 200 JSON', async () => {
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('lomi-mcp');
  });

  it('GET /ready returns 200 when env is valid', async () => {
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/ready`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ready).toBe(true);
  });

  it('GET /mcp without any credential returns 401 missing_credentials when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error_code).toBe('missing_credentials');
    const wwwAuth = res.headers.get('www-authenticate');
    expect(wwwAuth).toMatch(/Bearer/);
    expect(wwwAuth).toMatch(/resource_metadata/);
  });

  it('GET /mcp with a non-credential bearer returns invalid_credentials', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error_code).toBe('invalid_credentials');
  });

  it('GET /mcp with only x-lomi-api-key passes the transport gate when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      headers: { 'x-lomi-api-key': 'lomi_sk_test_1234567890abcd' },
    });
    // Gate passes (not 401); GET without a session id then yields 400.
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(400);
  });

  it('GET /mcp with a lomi_ bearer passes the transport gate when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      headers: { Authorization: 'Bearer lomi_sk_test_1234567890abcd' },
    });
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(400);
  });

  it('DELETE /mcp without session returns 400', async () => {
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(400);
  });

  it('GET /ready returns 503 in production without transport bearer', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOMI_MCP_BEARER_TOKEN;
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/ready`);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ready).toBe(false);
  });

  it('GET /.well-known/oauth-protected-resource returns metadata', async () => {
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(
      `http://127.0.0.1:${ctx.port}/.well-known/oauth-protected-resource`,
    );
    expect(res.status).toBe(200);
    // SAFETY: OAuth metadata response is a JSON object for assertion fields.

    const body = (await res.json()) as JsonObject;
    expect(body.resource).toBeTruthy();
  });

  it('GET path-scoped /.well-known/oauth-protected-resource/mcp returns metadata', async () => {
    process.env.LOMI_MCP_RESOURCE_URL = 'https://mcp.lomi.africa/mcp';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(
      `http://127.0.0.1:${ctx.port}/.well-known/oauth-protected-resource/mcp`,
    );
    expect(res.status).toBe(200);
    // SAFETY: OAuth metadata response is a JSON object for assertion fields.

    const body = (await res.json()) as JsonObject;
    expect(body.resource).toBe('https://mcp.lomi.africa/mcp');
  });

  it('POST /mcp without session credentials returns WWW-Authenticate challenge', async () => {
    delete process.env.LOMI_MCP_BEARER_TOKEN;
    delete process.env.LOMI_PROVISIONING_KEY;
    delete process.env.LOMI_SECRET_KEY;
    delete process.env.X_API_KEY;
    process.env.LOMI_MCP_RESOURCE_URL = 'https://mcp.lomi.africa/mcp';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0' },
        },
      }),
    });
    expect(res.status).toBe(401);
    const wwwAuth = res.headers.get('www-authenticate');
    expect(wwwAuth).toMatch(/Bearer/);
    expect(wwwAuth).toMatch(/resource_metadata/);
    expect(wwwAuth).toMatch(/oauth-protected-resource\/mcp/);
  });

  it('POST /mcp/guest initialize is not 401 when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    delete process.env.LOMI_PROVISIONING_KEY;
    delete process.env.LOMI_SECRET_KEY;
    delete process.env.X_API_KEY;
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'guest-test', version: '0' },
        },
      }),
    });
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });

  it('GET /mcp/guest without a session is not 401 when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp/guest`);
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(400);
  });

  it('GET /mcp with lomi_oat_* bearer passes transport gate when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    process.env.INTERNAL_API_KEY = 'test-internal-key';
    const realFetch = globalThis.fetch.bind(globalThis);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input, init) => {
        const url = String(input);
        if (url.includes('/oauth/introspect/mcp')) {
          return new Response(
            JSON.stringify({
              active: true,
              grant_type: 'merchant',
              connection_key: 'lomi_sk_test_oauth_connection_key',
              access_level: 'read',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return realFetch(input, init);
      },
    );
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      headers: { Authorization: 'Bearer lomi_oat_synth_test_token' },
    });
    fetchMock.mockRestore();
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(400);
  });

  it('GET /mcp with unintrospectable lomi_oat_* is rejected when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    delete process.env.INTERNAL_API_KEY;
    delete process.env.CRON_SECRET;
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    // Distinct token so a prior introspect cache entry cannot satisfy the gate.
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      headers: { Authorization: 'Bearer lomi_oat_unconfigured_introspect_token' },
    });
    expect(res.status).toBe(401);
  });

  it('POST /mcp initialize with introspected lomi_oat_* opens a session', async () => {
    process.env.INTERNAL_API_KEY = 'test-internal-key';
    process.env.LOMI_MCP_RESOURCE_URL = 'https://mcp.lomi.africa/mcp';
    const realFetch = globalThis.fetch.bind(globalThis);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input, init) => {
        const url = String(input);
        if (url.includes('/oauth/introspect/mcp')) {
          return new Response(
            JSON.stringify({
              active: true,
              grant_type: 'merchant',
              connection_key: 'lomi_sk_test_oauth_connection_key',
              access_level: 'read',
              scope: 'merchant.read',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return realFetch(input, init);
      },
    );

    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer lomi_oat_test_session_token',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0' },
        },
      }),
    });
    fetchMock.mockRestore();
    expect(res.status).not.toBe(401);
  });

  it('rate limits MCP routes when LOMI_MCP_RATE_LIMIT_RPM is low', async () => {
    process.env.LOMI_MCP_RATE_LIMIT_RPM = '2';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const url = `http://127.0.0.1:${ctx.port}/mcp`;
    const r1 = await fetch(url);
    const r2 = await fetch(url);
    const r3 = await fetch(url);
    expect(r1.status).not.toBe(429);
    expect(r2.status).not.toBe(429);
    expect(r3.status).toBe(429);
  });

  it('GET /.well-known/mcp returns a public tools preview', async () => {
    process.env.LOMI_MCP_RESOURCE_URL = 'https://mcp.lomi.africa/mcp';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/.well-known/mcp`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as JsonObject;
    expect(body.mcp).toBe('https://mcp.lomi.africa/mcp');
    expect(body.mcp_guest).toBe('https://mcp.lomi.africa/mcp/guest');
    expect(Array.isArray(body.tools_preview)).toBe(true);
  });

  it('GET /server-card returns MCP server card metadata', async () => {
    process.env.LOMI_MCP_RESOURCE_URL = 'https://mcp.lomi.africa/mcp';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/server-card`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as JsonObject;
    expect(body.name).toBe('io.lomi/mcp');
  });

  it('GET /.well-known/oauth-authorization-server points at the API issuer', async () => {
    process.env.LOMI_OAUTH_ISSUER = 'https://api.lomi.africa';
    const manifest = parseManifest(validateJsonValue(manifestJson));
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(
      `http://127.0.0.1:${ctx.port}/.well-known/oauth-authorization-server`,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as JsonObject;
    expect(body.issuer).toBe('https://api.lomi.africa');
    expect(body.authorization_endpoint).toBe(
      'https://api.lomi.africa/oauth/authorize',
    );
  });
});
