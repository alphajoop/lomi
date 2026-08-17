/**
 * Runtime validation for one generated MCP tool (used by generate-tools + tests).
 */
import type { ResolvedJsonSchema } from "../../src/generator/openapi-helpers.js";
import { isJsonObject, isString } from "@lomi./shared";

export type ManifestActionDraft = {
  operationKey: string;
  pathTemplate: string;
  pathParamNames: string[];
  wantsBody: boolean;
};

export type ManifestToolDraft = {
  name: string;
  inputSchema: ResolvedJsonSchema;
  actions: { [action: string]: ManifestActionDraft };
};

type SchemaProperties = { [key: string]: ResolvedJsonSchema };

export function validateManifestToolEntry(tool: ManifestToolDraft): void {
  const rawProps = tool.inputSchema.properties;
  const props: SchemaProperties | null =
    rawProps !== undefined && isJsonObject(rawProps) ? rawProps : null;

  const required = new Set(
    Array.isArray(tool.inputSchema.required)
      ? tool.inputSchema.required.filter(isString)
      : [],
  );

  if (!props || !("action" in props)) {
    throw new Error(
      `[mcp manifest] Tool "${tool.name}": grouped tools must declare an "action" property`,
    );
  }
  if (!required.has("action")) {
    throw new Error(
      `[mcp manifest] Tool "${tool.name}": "action" must appear in inputSchema.required`,
    );
  }

  const actionSchema = props["action"];
  const enumValues = Array.isArray(actionSchema?.["enum"])
    ? actionSchema["enum"].filter(isString)
    : [];
  const actionNames = Object.keys(tool.actions).sort();
  const enumSorted = [...enumValues].sort();
  if (
    actionNames.length !== enumSorted.length ||
    actionNames.some((name, i) => name !== enumSorted[i])
  ) {
    throw new Error(
      `[mcp manifest] Tool "${tool.name}": action enum must match actions keys`,
    );
  }

  for (const [action, spec] of Object.entries(tool.actions)) {
    for (const p of spec.pathParamNames) {
      if (!props || !(p in props)) {
        throw new Error(
          `[mcp manifest] Tool "${tool.name}" action "${action}" (${spec.operationKey}): path param "${p}" missing from inputSchema.properties`,
        );
      }
    }

    const templateParams = spec.pathTemplate.match(/\{([^}]+)\}/g) ?? [];
    const fromTemplate = templateParams.map((s) =>
      s.replace(/^\{|\}$/g, "").trim(),
    );
    for (const p of fromTemplate) {
      if (!spec.pathParamNames.includes(p)) {
        throw new Error(
          `[mcp manifest] Tool "${tool.name}" action "${action}" (${spec.operationKey}): template has {${p}} but pathParamNames omits it`,
        );
      }
    }

    if (spec.wantsBody && (!props || !("body" in props))) {
      throw new Error(
        `[mcp manifest] Tool "${tool.name}" action "${action}" (${spec.operationKey}): wantsBody but inputSchema.properties.body missing`,
      );
    }
  }
}
