import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { callLomiRest } from '../src/lomi-http.ts';
import type { ManifestTool } from '../src/manifest.ts';

describe('callLomiRest', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"ok":true}', { status: 200 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('substitutes path params and sets API key', async () => {
    const tool: ManifestTool = {
      name: 't',
      operationKey: 'GET /customers/{id}',
      method: 'get',
      pathTemplate: '/customers/{id}',
      pathParamNames: ['id'],
      queryParamNames: [],
      title: '',
      description: '',
      tags: [],
      operationId: '',
      write: false,
      wantsBody: false,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    };

    await callLomiRest(tool, { id: 'abc-123' }, {
      baseUrl: 'https://api.example.test',
      apiKey: 'secret',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const call = vi.mocked(fetch).mock.calls[0]!;
    expect(call[0]).toBe('https://api.example.test/customers/abc-123');
    const init = call[1] as RequestInit;
    expect(init.method).toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-API-KEY']).toBe('secret');
  });

  it('only forwards header_* keys declared on inputSchema', async () => {
    const tool: ManifestTool = {
      name: 't',
      operationKey: 'GET /x',
      method: 'get',
      pathTemplate: '/x',
      pathParamNames: [],
      queryParamNames: [],
      title: '',
      description: '',
      tags: [],
      operationId: '',
      write: false,
      wantsBody: false,
      inputSchema: {
        type: 'object',
        properties: {
          'header_X-Request-Id': { type: 'string' },
        },
      },
    };

    await callLomiRest(
      tool,
      {
        'header_X-Request-Id': 'rid',
        header_Evil: 'no',
      },
      { baseUrl: 'https://api.example.test', apiKey: 'k' },
    );

    const init = vi.mocked(fetch).mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toBe('rid');
    expect(headers.Evil).toBeUndefined();
  });
});
