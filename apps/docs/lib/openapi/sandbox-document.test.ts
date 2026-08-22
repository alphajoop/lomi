/* @proprietary license */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sandboxOnlyOpenApiDocument } from './sandbox-document';
import { isOriginAllowedForProxy } from '@/lib/openapi-secure-proxy';

test('drops live OpenAPI servers from the Try-it document', () => {
  const filtered = sandboxOnlyOpenApiDocument({
    openapi: '3.0.3',
    servers: [
      { url: 'https://api.lomi.africa', description: 'Live' },
      { url: 'https://sandbox.api.lomi.africa', description: 'Test' },
    ],
  });
  const servers = filtered.servers;
  assert.ok(Array.isArray(servers));
  assert.equal(servers.length, 1);
  assert.deepEqual(servers[0], {
    url: 'https://sandbox.api.lomi.africa',
    description: 'Test',
  });
});

test('rejects non-sandbox origins for the docs proxy', () => {
  const list = ['https://sandbox.api.lomi.africa'];
  assert.equal(
    isOriginAllowedForProxy(
      'https://sandbox.api.lomi.africa/checkout-sessions',
      list,
    ),
    true,
  );
  assert.equal(
    isOriginAllowedForProxy('https://api.lomi.africa/checkout-sessions', list),
    false,
  );
  assert.equal(
    isOriginAllowedForProxy('http://evil.example/charge', list),
    false,
  );
});
