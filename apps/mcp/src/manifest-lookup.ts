import type { ToolsManifest } from "./manifest.js";

/**
 * Resolve an OpenAPI operation key to the grouped MCP call agents should use.
 * Example: "POST /customers" → "lomi_customers action=create"
 */
export function toolRefForOperation(
  manifest: ToolsManifest,
  operationKey: string,
): string {
  for (const tool of manifest.tools) {
    for (const [action, spec] of Object.entries(tool.actions)) {
      if (spec.operationKey === operationKey) {
        return `${tool.name} action=${action}`;
      }
    }
  }
  return operationKey;
}
