/**
 * Generates src/generated/tools-manifest.json from apps/docs/openapi.json
 * and the public merchant operation allowlist (same contract as SDKs).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type OpenAPISpec,
  buildInputJsonSchema,
  toolNameFromOperation,
} from '../generator/openapi-helpers.js';
import {
  type EnglishCopyOverride,
  resolveEnglishCopy,
} from '../generator/mcp-english-copy.js';
import {
  loadAlwaysLoadKeys,
  resolveToolPolicy,
} from '../tool-policy.js';
import { validateManifestToolEntry } from './validate-manifest-entry.js';
import {
  readSpecAndAllowlist,
  getNormalizedOperations,
  HTTP_WITH_BODY,
  METHOD_NAME_BY_OP,
} from '../../../sdks/scripts/public-sdk-operations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mcpRoot = join(__dirname, '../..');
const openapiPath = join(mcpRoot, '../docs/openapi.json');
const allowlistPath = join(
  mcpRoot,
  '../docs/lib/scripts/manual-api/_expected-public-operations.json',
);
const policyPath = join(__dirname, 'mcp-tool-policy.json');
const copyOverridesPath = join(__dirname, 'mcp-tool-copy.en.json');
const outDir = join(mcpRoot, 'src/generated');
const outFile = join(outDir, 'tools-manifest.json');

const WRITE_METHODS = new Set(['post', 'patch', 'put', 'delete']);

function assertUniqueToolNames(names: string[]): void {
  const seen = new Set<string>();
  for (const n of names) {
    if (seen.has(n)) throw new Error(`Duplicate MCP tool name: ${n}`);
    seen.add(n);
  }
}

function loadCopyOverrides(): Record<string, EnglishCopyOverride> {
  const raw = readFileSync(copyOverridesPath, 'utf-8');
  return JSON.parse(raw) as Record<string, EnglishCopyOverride>;
}

function main(): void {
  const { spec, allowed } = readSpecAndAllowlist(openapiPath, allowlistPath);
  const apiSpec = spec as OpenAPISpec;
  const { operations } = getNormalizedOperations(spec, allowed);
  const alwaysLoadKeys = loadAlwaysLoadKeys(
    JSON.parse(readFileSync(policyPath, 'utf-8')) as {
      alwaysLoadOperationKeys?: string[];
    },
  );
  const copyOverrides = loadCopyOverrides();

  const tools = operations.map((op) => {
    const name = toolNameFromOperation(op.httpMethodLower, op.pathTemplate);
    const tags = op.openApiOp.tags ?? [];

    const write = WRITE_METHODS.has(op.httpMethodLower);
    const wantsBody =
      HTTP_WITH_BODY.has(op.httpMethodLower) &&
      Boolean(op.openApiOp.requestBody);

    const inputSchema = buildInputJsonSchema({
      spec: apiSpec,
      operation: op.openApiOp,
      pathItem: op.pathItem,
      pathTemplate: op.pathTemplate,
      httpMethodLower: op.httpMethodLower,
      includeIdempotencyKey: write,
    });

    const { title, description } = resolveEnglishCopy({
      operationKey: op.operationKey,
      httpMethodLower: op.httpMethodLower,
      tags,
      methodNameByOp: METHOD_NAME_BY_OP,
      override: copyOverrides[op.operationKey],
      openApiSummary: op.summary,
      openApiDescription:
        typeof op.openApiOp.description === 'string'
          ? op.openApiOp.description
          : undefined,
    });

    const policy = resolveToolPolicy(
      {
        name,
        method: op.httpMethodLower,
        operationKey: op.operationKey,
        pathTemplate: op.pathTemplate,
        tags,
      },
      alwaysLoadKeys,
    );

    return {
      name,
      operationKey: op.operationKey,
      method: op.httpMethodLower,
      pathTemplate: op.pathTemplate,
      pathParamNames: op.pathParamNames,
      queryParamNames: op.queryParams.map((q) => q.name),
      title,
      description,
      tags,
      operationId: op.operationId,
      write,
      wantsBody,
      inputSchema,
      readOnly: policy.readOnly,
      destructive: policy.destructive,
      alwaysLoad: policy.alwaysLoad,
      searchHint: policy.searchHint,
    };
  });

  for (const t of tools) {
    validateManifestToolEntry(t);
  }

  tools.sort((a, b) => a.name.localeCompare(b.name));
  assertUniqueToolNames(tools.map((t) => t.name));

  const manifest = {
    manifestVersion: 1 as const,
    apiVersion: apiSpec.info?.version ?? 'unknown',
    apiTitle: apiSpec.info?.title ?? 'lomi. API',
    toolCount: tools.length,
    tools,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${outFile} (${tools.length} tools)`);
}

main();
