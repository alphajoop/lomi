import { describe, expect, it } from 'vitest';
import type { ToolsManifest } from '../src/manifest.js';

describe('registerMerchantTools read-only filter', () => {
  it('skips write tools when readOnlyOnly is true', async () => {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const { registerMerchantTools } = await import('../src/register-tools.js');

    const manifest: ToolsManifest = {
      manifestVersion: 'test',
      apiVersion: 'test',
      toolCount: 2,
      tools: [
        {
          name: 'read_tool',
          title: 'Read',
          description: 'read',
          method: 'GET',
          path: '/items',
          readOnly: true,
          destructive: false,
          searchHint: false,
          alwaysLoad: false,
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'write_tool',
          title: 'Write',
          description: 'write',
          method: 'POST',
          path: '/items',
          readOnly: false,
          destructive: false,
          searchHint: false,
          alwaysLoad: false,
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    };

    const server = new McpServer({ name: 'test', version: '0' });
    const registered: string[] = [];
    const original = server.registerTool.bind(server);
    server.registerTool = ((name: string, ...rest: unknown[]) => {
      registered.push(name);
      return original(name, ...(rest as Parameters<typeof original> extends [string, ...infer R] ? R : never));
    }) as typeof server.registerTool;

    registerMerchantTools(server, manifest, {
      getApiKey: () => 'lomi_sk_test_example',
      readOnlyOnly: true,
    });

    expect(registered).toContain('read_tool');
    expect(registered).not.toContain('write_tool');
  });
});
