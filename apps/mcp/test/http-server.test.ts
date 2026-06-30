import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';

import manifestJson from '../src/generated/tools-manifest.json' with { type: 'json' };
import { createHttpApplication } from '../src/http.js';
import { parseManifest } from '../src/manifest-parse.js';

const ORIGINAL_ENV = { ...process.env };

function listen(
  app: ReturnType<typeof createHttpApplication>,
): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
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
    const manifest = parseManifest(manifestJson);
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
    const manifest = parseManifest(manifestJson);
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/ready`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ready).toBe(true);
  });

  it('GET /mcp without bearer returns 401 with error_code when gated', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(manifestJson);
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error_code).toBe('missing_bearer');
  });

  it('GET /mcp with wrong bearer returns invalid_bearer', async () => {
    process.env.LOMI_MCP_BEARER_TOKEN = 'secret-gate';
    const manifest = parseManifest(manifestJson);
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/mcp`, {
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error_code).toBe('invalid_bearer');
  });

  it('DELETE /mcp without session returns 400', async () => {
    const manifest = parseManifest(manifestJson);
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
    const manifest = parseManifest(manifestJson);
    const app = createHttpApplication(manifest);
    const ctx = await listen(app);
    server = ctx.server;
    const res = await fetch(`http://127.0.0.1:${ctx.port}/ready`);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ready).toBe(false);
  });

  it('rate limits MCP routes when LOMI_MCP_RATE_LIMIT_RPM is low', async () => {
    process.env.LOMI_MCP_RATE_LIMIT_RPM = '2';
    const manifest = parseManifest(manifestJson);
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
});
