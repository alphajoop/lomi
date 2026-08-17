import type { ManifestAction, ManifestTool, RestCallSpec } from "./manifest.js";
import { isString, type JsonObject } from "@lomi./shared";

export function restCallSpecFor(
  tool: ManifestTool,
  action: ManifestAction,
): RestCallSpec {
  return {
    method: action.method,
    pathTemplate: action.pathTemplate,
    pathParamNames: action.pathParamNames,
    queryParamNames: action.queryParamNames,
    wantsBody: action.wantsBody,
    inputSchema: tool.inputSchema,
  };
}

export function resolveManifestAction(
  tool: ManifestTool,
  args: JsonObject,
): ManifestAction {
  const action = args["action"];
  const allowed = Object.keys(tool.actions).sort();
  if (!isString(action) || !(action in tool.actions)) {
    throw new Error(
      `Invalid or missing action on ${tool.name}. Use one of: ${allowed.join(", ")}`,
    );
  }
  const spec = tool.actions[action];
  if (!spec) {
    throw new Error(
      `Invalid or missing action on ${tool.name}. Use one of: ${allowed.join(", ")}`,
    );
  }
  for (const name of spec.requiredInput) {
    const value = args[name];
    if (value === undefined || value === null) {
      throw new Error(`Action "${action}" on ${tool.name} requires "${name}"`);
    }
  }
  return spec;
}
