import { describe, expect, it } from 'vitest';

import type { ManifestTool } from '../src/manifest.ts';
import { scoreManifestTool, searchManifestTools } from '../src/register-search-tools.ts';

const sampleTool = (overrides: Partial<ManifestTool>): ManifestTool => ({
  name: 'lomi_get_customers',
  operationKey: 'GET /customers',
  method: 'get',
  pathTemplate: '/customers',
  pathParamNames: [],
  queryParamNames: [],
  title: 'List Customers',
  description: 'List customers',
  tags: ['Customers'],
  operationId: 'x',
  write: false,
  wantsBody: false,
  inputSchema: { type: 'object', properties: {} },
  readOnly: true,
  destructive: false,
  alwaysLoad: true,
  searchHint: 'customers get list',
  ...overrides,
});

describe('register-search-tools', () => {
  it('scores exact name matches highest', () => {
    const tool = sampleTool({});
    expect(scoreManifestTool(tool, 'lomi_get_customers')).toBeGreaterThan(
      scoreManifestTool(tool, 'webhook'),
    );
  });

  it('returns matches sorted by score', () => {
    const manifest = {
      manifestVersion: 1 as const,
      apiVersion: '1',
      apiTitle: 't',
      toolCount: 2,
      tools: [
        sampleTool({ name: 'lomi_get_customers' }),
        sampleTool({
          name: 'lomi_get_webhooks',
          title: 'List Webhooks',
          tags: ['Webhooks'],
          searchHint: 'webhooks get',
        }),
      ],
    };
    const results = searchManifestTools(manifest, 'customer');
    expect(results[0]?.name).toBe('lomi_get_customers');
  });
});
