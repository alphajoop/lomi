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
import { registerSearchToolsMetaTool } from './register-search-tools.js';
import { registerLomiRegisterAgent } from './register-agent.js';
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
  /**
   * Invoked when lomi_register_agent mints a sandbox provisioning key.
   */
  onProvisioningKeyDiscovered?: (key: string) => void;
  /**
   * Guest bootstrap transport: register_agent, search, provisioning (no partner
   * or merchant REST tools), plus docs resources.
   */
  guest?: boolean;
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
    onProvisioningKeyDiscovered,
    guest = false,
  } = options;
  const server = new McpServer(
    { name: 'lomi', title: 'lomi.', version: manifest.apiVersion },
    {
      instructions: buildServerInstructions(mode, guest),
    },
  );
  registerLomiRegisterAgent(server, { onProvisioningKeyDiscovered });
  registerProvisioningTools(server, provisioningManifest, {
    getProvisioningKey,
    getPartnerKey,
    onMerchantKeyDiscovered,
    skipPartner: guest,
  });
  if (!guest) {
    registerMerchantTools(server, manifest, {
      getApiKey,
      readOnlyOnly: merchantAccessLevel === 'read',
    });
  } else {
    registerSearchToolsOnGuest(server, manifest, provisioningManifest);
  }
  registerLomiResources(server, manifest);
  if (!guest) {
    registerLomiPrompts(server, manifest, provisioningManifest);
  }
  return server;
}

function registerSearchToolsOnGuest(
  server: import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
  merchantManifest: ToolsManifest,
  provisioningManifest: ProvisioningToolsManifest,
): void {
  const combined = {
    ...merchantManifest,
    tools: [...provisioningManifest.tools, ...merchantManifest.tools],
    toolCount: provisioningManifest.tools.length + merchantManifest.tools.length,
  };
  registerSearchToolsMetaTool(server, combined);
}
