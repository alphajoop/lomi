/**
 * Runtime validation for one generated MCP tool (used by generate-tools + tests).
 */
import type { ResolvedJsonSchema } from '../generator/openapi-helpers.js';

export type ManifestToolDraft = {
  name: string;
  operationKey: string;
  method: string;
  pathTemplate: string;
  pathParamNames: string[];
  wantsBody: boolean;
  inputSchema: ResolvedJsonSchema;
};

export function validateManifestToolEntry(tool: ManifestToolDraft): void {
  const props =
    tool.inputSchema.properties &&
    typeof tool.inputSchema.properties === 'object' &&
    !Array.isArray(tool.inputSchema.properties)
      ? (tool.inputSchema.properties as Record<string, unknown>)
      : null;

  const required = new Set(
    Array.isArray(tool.inputSchema.required)
      ? (tool.inputSchema.required as string[])
      : [],
  );

  for (const p of tool.pathParamNames) {
    if (!props || !(p in props)) {
      throw new Error(
        `[mcp manifest] Tool "${tool.name}" (${tool.operationKey}): path param "${p}" missing from inputSchema.properties`,
      );
    }
    if (!required.has(p)) {
      throw new Error(
        `[mcp manifest] Tool "${tool.name}" (${tool.operationKey}): path param "${p}" must appear in inputSchema.required`,
      );
    }
  }

  const templateParams = tool.pathTemplate.match(/\{([^}]+)\}/g) ?? [];
  const fromTemplate = templateParams.map((s) =>
    s.replace(/^\{|\}$/g, '').trim(),
  );
  for (const p of fromTemplate) {
    if (!tool.pathParamNames.includes(p)) {
      throw new Error(
        `[mcp manifest] Tool "${tool.name}" (${tool.operationKey}): template has {${p}} but pathParamNames omits it`,
      );
    }
  }

  if (tool.wantsBody) {
    if (!props || !('body' in props)) {
      throw new Error(
        `[mcp manifest] Tool "${tool.name}" (${tool.operationKey}): wantsBody but inputSchema.properties.body missing`,
      );
    }
    if (!required.has('body')) {
      throw new Error(
        `[mcp manifest] Tool "${tool.name}" (${tool.operationKey}): wantsBody but "body" not in inputSchema.required`,
      );
    }
  }
}
