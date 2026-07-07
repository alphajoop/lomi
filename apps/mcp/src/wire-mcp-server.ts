import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolsManifest } from './manifest.js';
import { registerLomiPrompts } from './register-prompts.js';
import { registerLomiResources } from './register-resources.js';
import { registerMerchantTools } from './register-tools.js';
import provisioningManifestJson from './generated/provisioning-tools-manifest.json' with { type: 'json' };
import {
  registerProvisioningTools,
  type ProvisioningToolsManifest,
} from './register-provisioning-tools.js';
import { buildServerInstructions, type InstructionMode } from './server-instructions.js';
import { getOptionalProvisioningKey } from './env-config.js';

export type WireMcpServerOptions = {
  manifest: ToolsManifest;
  provisioningManifest?: ProvisioningToolsManifest;
  mode: InstructionMode;
  getApiKey: () => string | null;
  getProvisioningKey?: () => string | null;
  /**
   * Invoked when a provisioning tool returns a usable merchant secret key.
   * Implementations should adopt it as the session's merchant credential so
   * the agent can drive the full merchant REST API without reconnecting.
   */
  onMerchantKeyDiscovered?: (secretKey: string) => void;
};

/** Create and wire tools, resources, and prompts on an MCP server instance. */
export function wireMcpServer(options: WireMcpServerOptions): McpServer {
  const {
    manifest,
    provisioningManifest = provisioningManifestJson as ProvisioningToolsManifest,
    mode,
    getApiKey,
    getProvisioningKey = getOptionalProvisioningKey,
    onMerchantKeyDiscovered,
  } = options;
  const server = new McpServer(
    { name: 'lomi.', version: manifest.apiVersion },
    {
      instructions: buildServerInstructions(mode),
    },
  );
  registerProvisioningTools(server, provisioningManifest, {
    getProvisioningKey,
    onMerchantKeyDiscovered,
  });
  registerMerchantTools(server, manifest, { getApiKey });
  registerLomiResources(server, manifest);
  registerLomiPrompts(server, manifest, provisioningManifest);
  return server;
}
