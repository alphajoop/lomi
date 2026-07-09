import { describe, expect, it } from 'vitest';
import type { ToolsManifest } from '../src/manifest.js';
import { legacyToolName } from '../src/register-tools.js';

describe('legacyToolName', () => {
  it('returns mechanical name when it differs from the curated name', () => {
    expect(
      legacyToolName({
        name: 'lomi_create_checkout_session',
        method: 'post',
        pathTemplate: '/checkout-sessions',
      } as Parameters<typeof legacyToolName>[0]),
    ).toBe('lomi_post_checkout_sessions');
  });

  it('returns null when the curated name matches the mechanical name', () => {
    expect(
      legacyToolName({
        name: 'lomi_get_foo',
        method: 'get',
        pathTemplate: '/foo',
      } as Parameters<typeof legacyToolName>[0]),
    ).toBeNull();
  });
});

describe('registerMerchantTools legacy aliases', () => {
  it('registers legacy mechanical names alongside curated names', async () => {
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const { registerMerchantTools } = await import('../src/register-tools.js');

    const manifest: ToolsManifest = {
      manifestVersion: 1,
      apiVersion: 'test',
      apiTitle: 'test',
      toolCount: 1,
      tools: [
        {
          name: 'lomi_create_checkout_session',
          operationKey: 'POST /checkout-sessions',
          title: 'Create checkout session',
          description: 'create',
          method: 'post',
          pathTemplate: '/checkout-sessions',
          pathParamNames: [],
          queryParamNames: [],
          tags: [],
          operationId: 'CheckoutSessionsController_create',
          write: true,
          wantsBody: true,
          readOnly: false,
          destructive: false,
          searchHint: 'checkout post session sessions',
          alwaysLoad: true,
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
    });

    expect(registered).toContain('lomi_create_checkout_session');
    expect(registered).toContain('lomi_post_checkout_sessions');
  });
});
