/**
 * Types for src/generated/tools-manifest.json (see scripts/generate-tools.ts).
 */

export type ManifestTool = {
  name: string;
  operationKey: string;
  method: string;
  pathTemplate: string;
  pathParamNames: string[];
  queryParamNames: string[];
  title: string;
  description: string;
  tags: string[];
  operationId: string;
  write: boolean;
  wantsBody: boolean;
  inputSchema: Record<string, unknown>;
  readOnly: boolean;
  destructive: boolean;
  alwaysLoad: boolean;
  searchHint: string;
};

export type ToolsManifest = {
  manifestVersion: 1;
  apiVersion: string;
  apiTitle: string;
  toolCount: number;
  tools: ManifestTool[];
};
