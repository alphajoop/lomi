import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fromJSONSchema } from 'zod';

import type { ManifestTool } from './manifest.js';
import { callLomiRest, formatHttpResult } from './lomi-http.js';
import { getLomiApiBaseUrl } from './env-config.js';
import { mcpLog } from './mcp-request-context.js';
import { truncateToolResultText } from './truncate-result.js';
import { extractMerchantSecretKey } from './extract-secret-key.js';

export type ProvisioningToolsManifest = {
  manifestVersion: 1;
  apiVersion: string;
  apiTitle: string;
  toolCount: number;
  tools: Array<ManifestTool & { authMode?: 'provisioning' }>;
};

export type ProvisioningToolRegistrationContext = {
  baseUrl: string;
  getProvisioningKey: () => string | null;
  /**
   * Called when a provisioning response yields a usable merchant secret key,
   * so the session can adopt it and unlock the full merchant REST surface.
   */
  onMerchantKeyDiscovered?: (secretKey: string) => void;
};

function registerOneProvisioningTool(
  server: McpServer,
  tool: ManifestTool,
  ctx: ProvisioningToolRegistrationContext,
): void {
  const inputSchema = fromJSONSchema(tool.inputSchema, {
    defaultTarget: 'openapi-3.0',
  });

  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema,
      annotations: {
        readOnlyHint: tool.readOnly,
        destructiveHint: tool.destructive,
      },
      _meta: {
        'anthropic/searchHint': tool.searchHint,
        'anthropic/alwaysLoad': tool.alwaysLoad,
        'lomi/authMode': 'provisioning',
      },
    },
    async (args: unknown) => {
      const parsed = inputSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid tool arguments: ${parsed.error.message}`,
            },
          ],
          isError: true,
        };
      }

      const provisioningKey = ctx.getProvisioningKey();
      if (!provisioningKey) {
        return {
          content: [
            {
              type: 'text',
              text:
                'Missing provisioning key: set LOMI_PROVISIONING_KEY or send x-lomi-provisioning-key when creating the MCP session. See https://docs.lomi.africa/build/mcp',
            },
          ],
          isError: true,
        };
      }

      try {
        const t0 = Date.now();
        const result = await callLomiRest(tool, parsed.data as Record<string, unknown>, {
          baseUrl: ctx.baseUrl,
          apiKey: provisioningKey,
          authHeaderName: 'X-Lomi-Provisioning-Key',
        });
        const latencyMs = Date.now() - t0;
        mcpLog(
          'provisioning_tool_upstream_complete',
          {
            tool: tool.name,
            method: tool.method,
            upstreamStatus: result.status,
            latencyMs,
          },
          result.status >= 400 ? 'warn' : 'info',
        );
        const ok = result.status >= 200 && result.status < 300;
        if (ok && ctx.onMerchantKeyDiscovered) {
          const secretKey = extractMerchantSecretKey(result.bodyText);
          if (secretKey) {
            ctx.onMerchantKeyDiscovered(secretKey);
            mcpLog(
              'provisioning_merchant_key_promoted',
              { tool: tool.name },
              'info',
            );
          }
        }
        const text = truncateToolResultText(formatHttpResult(result));
        return {
          content: [{ type: 'text', text }],
          ...(ok ? {} : { isError: true }),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: message }],
          isError: true,
        };
      }
    },
  );
}

export function registerProvisioningTools(
  server: McpServer,
  manifest: ProvisioningToolsManifest,
  ctx?: Partial<ProvisioningToolRegistrationContext>,
): void {
  const baseUrl = ctx?.baseUrl ?? getLomiApiBaseUrl();
  const getProvisioningKey =
    ctx?.getProvisioningKey ?? (() => process.env.LOMI_PROVISIONING_KEY?.trim() ?? null);
  const fullCtx: ProvisioningToolRegistrationContext = {
    baseUrl,
    getProvisioningKey,
    onMerchantKeyDiscovered: ctx?.onMerchantKeyDiscovered,
  };

  for (const tool of manifest.tools) {
    registerOneProvisioningTool(server, tool, fullCtx);
  }
}
