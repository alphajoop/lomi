/* @proprietary license */

import fs from 'node:fs';
import {
  asJsonValue,
  isJsonObject,
  isString,
  parseJson,
  type JsonValue,
} from '@lomi./shared';
import policyJson from '../../mcp/config/mcp-tool-policy.json';

export type McpAuthMode = 'merchant' | 'provisioning' | 'partner';

export type McpTwin = {
  operationKey: string;
  method: string;
  path: string;
  tool: string;
  action: string;
  toolTitle: string;
  authMode: McpAuthMode;
};

export type McpToolGroupTwins = {
  tool: string;
  title: string;
  authMode: McpAuthMode;
  twins: McpTwin[];
};

const MCP_GUIDE_PATH = '/build/mcp';

function parseAuthMode(value: JsonValue | undefined): McpAuthMode {
  if (value === 'provisioning') return 'provisioning';
  if (value === 'partner') return 'partner';
  if (value === 'merchant' || value === undefined) return 'merchant';
  return 'merchant';
}

export function operationKey(method: string, route: string): string {
  const trimmed = route.trim();
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${method.trim().toUpperCase()} ${withSlash}`;
}

export function parseOperationKey(
  key: string,
): { method: string; path: string } | null {
  const match = /^([A-Z]+)\s+(\/.+)$/.exec(key.trim());
  if (!match || !match[1] || !match[2]) return null;
  return { method: match[1], path: match[2] };
}

export function mcpTwinAnchor(tool: string, action: string): string {
  return `${tool}-${action}`;
}

export function mcpTwinHref(tool: string, action: string): string {
  return `${MCP_GUIDE_PATH}#${mcpTwinAnchor(tool, action)}`;
}

function parseGroup(value: JsonValue): McpToolGroupTwins | null {
  if (!isJsonObject(value)) return null;
  const name = value.name;
  const title = value.title;
  const actionsValue = value.actions;
  if (!isString(name) || !isString(title) || !isJsonObject(actionsValue)) {
    return null;
  }

  const authMode = parseAuthMode(value.authMode);
  const twins: McpTwin[] = [];

  for (const [action, operation] of Object.entries(actionsValue)) {
    if (!isString(operation)) continue;
    const parsed = parseOperationKey(operation);
    if (!parsed) continue;
    twins.push({
      operationKey: operation,
      method: parsed.method,
      path: parsed.path,
      tool: name,
      action,
      toolTitle: title,
      authMode,
    });
  }

  return { tool: name, title, authMode, twins };
}

export function parseMcpToolPolicy(value: JsonValue): {
  excludedOperationKeys: string[];
  groups: McpToolGroupTwins[];
} {
  if (!isJsonObject(value)) {
    throw new Error('MCP tool policy must be a JSON object');
  }

  const excluded: string[] = [];
  const excludedValue = value.mcpExcludedOperationKeys;
  if (Array.isArray(excludedValue)) {
    for (const entry of excludedValue) {
      if (isString(entry)) excluded.push(entry);
    }
  }

  const groups: McpToolGroupTwins[] = [];
  const collect = (raw: JsonValue | undefined) => {
    if (!Array.isArray(raw)) return;
    for (const entry of raw) {
      const group = parseGroup(entry);
      if (group) groups.push(group);
    }
  };

  collect(value.groups);
  collect(value.provisioningGroups);

  return { excludedOperationKeys: excluded, groups };
}

export function flattenMcpTwins(
  groups: McpToolGroupTwins[],
): Map<string, McpTwin> {
  const byOperation = new Map<string, McpTwin>();
  for (const group of groups) {
    for (const twin of group.twins) {
      if (!byOperation.has(twin.operationKey)) {
        byOperation.set(twin.operationKey, twin);
      }
    }
  }
  return byOperation;
}

export function loadMcpToolPolicyFile(policyPath?: string): JsonValue {
  if (!policyPath) {
    return asJsonValue(policyJson);
  }
  return parseJson(fs.readFileSync(policyPath, 'utf8'));
}

let cachedGroups: McpToolGroupTwins[] | null = null;
let cachedByOperation: Map<string, McpTwin> | null = null;
let cachedExcluded: Set<string> | null = null;

function ensureCache(): void {
  if (cachedGroups && cachedByOperation && cachedExcluded) return;
  const parsed = parseMcpToolPolicy(loadMcpToolPolicyFile());
  cachedGroups = parsed.groups;
  cachedByOperation = flattenMcpTwins(parsed.groups);
  cachedExcluded = new Set(parsed.excludedOperationKeys);
}

export function listMcpToolGroups(): McpToolGroupTwins[] {
  ensureCache();
  return cachedGroups ?? [];
}

export function mcpExcludedOperationKeys(): Set<string> {
  ensureCache();
  return cachedExcluded ?? new Set();
}

export function findMcpTwin(
  method: string,
  route: string,
): McpTwin | undefined {
  ensureCache();
  return cachedByOperation?.get(operationKey(method, route));
}

export function restDocsHrefFromMdxFile(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, '/');
  const match = /(?:^|\/)api\/([^/]+)\/([^/]+?)(?:\.fr)?\.mdx$/.exec(
    normalized,
  );
  if (!match || !match[1] || !match[2]) return null;
  if (match[2] === 'index') return null;
  return `/api/${match[1]}/${match[2]}`;
}
