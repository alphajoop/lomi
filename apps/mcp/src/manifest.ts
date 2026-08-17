import type { JsonObject } from "@lomi./shared";

/**
 * Types for src/generated/tools-manifest.json (see scripts/generate-tools.ts).
 */

export type ManifestAction = {
  operationKey: string;
  method: string;
  pathTemplate: string;
  pathParamNames: string[];
  queryParamNames: string[];
  operationId: string;
  write: boolean;
  wantsBody: boolean;
  title: string;
  description: string;
  tags: string[];
  /** Fields required for this action (path params, body, required query/headers). */
  requiredInput: string[];
};

export type ManifestTool = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  write: boolean;
  inputSchema: JsonObject;
  readOnly: boolean;
  destructive: boolean;
  alwaysLoad: boolean;
  searchHint: string;
  actions: { [action: string]: ManifestAction };
  authMode?: "merchant" | "provisioning" | "partner";
};

export type ToolsManifest = {
  manifestVersion: 1;
  apiVersion: string;
  apiTitle: string;
  toolCount: number;
  tools: ManifestTool[];
};

/** REST fields needed to execute one grouped action. */
export type RestCallSpec = {
  method: string;
  pathTemplate: string;
  pathParamNames: string[];
  queryParamNames: string[];
  wantsBody: boolean;
  inputSchema: JsonObject;
};
