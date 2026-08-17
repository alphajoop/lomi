import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolsManifest } from './manifest.js';
import { parseManifest } from './manifest-parse.js';
import { registerLomiPrompts } from './register-prompts.js';
import { registerLomiResources } from './register-resources.js';
import { registerMerchantTools } from './register-tools.js';
import provisioningManifestJson from './generated/provisioning-tools-manifest.json' with { type: 'json' };
import {
  registerProvisioningTools,
  type ProvisioningToolsManifest,
} from './register-provisioning-tools.js';
import { buildServerInstructions, type InstructionMode } from './server-instructions.js';
import {
  getOptionalPartnerKey,
  getOptionalProvisioningKey,
} from './env-config.js';
import { validateJsonValue } from "@lomi./shared";

export type WireMcpServerOptions = {
  manifest: ToolsManifest;
  provisioningManifest?: ProvisioningToolsManifest;
  mode: InstructionMode;
  getApiKey: () => string | null;
  getProvisioningKey?: () => string | null;
  getPartnerKey?: () => string | null;
  /** When read, only register merchant tools marked readOnly. */
  merchantAccessLevel?: 'read' | 'write' | 'full';
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
    provisioningManifest = parseManifest(validateJsonValue(provisioningManifestJson)),
    mode,
    getApiKey,
    getProvisioningKey = getOptionalProvisioningKey,
    getPartnerKey = getOptionalPartnerKey,
    merchantAccessLevel = 'full',
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
    getPartnerKey,
    onMerchantKeyDiscovered,
  });
  registerMerchantTools(server, manifest, {
    getApiKey,
    readOnlyOnly: merchantAccessLevel === 'read',
  });
  registerLomiResources(server, manifest);
  registerLomiPrompts(server, manifest, provisioningManifest);
  return server;
}
