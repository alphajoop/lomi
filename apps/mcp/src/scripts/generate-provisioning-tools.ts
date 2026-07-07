/**
 * Generates src/generated/provisioning-tools-manifest.json from agent-openapi.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type OpenAPISpec,
  buildInputJsonSchema,
  toolNameFromOperation,
} from '../generator/openapi-helpers.js';
import { readSpecAndAllowlist } from '../../../sdks/scripts/public-sdk-operations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mcpRoot = join(__dirname, '../..');
const openapiPath = join(mcpRoot, '../docs/agent-openapi.json');
const allowlistPath = join(
  mcpRoot,
  '../docs/lib/scripts/manual-api/_expected-provisioning-operations.json',
);
const outDir = join(mcpRoot, 'src/generated');
const outFile = join(outDir, 'provisioning-tools-manifest.json');

const WRITE_METHODS = new Set(['post', 'patch', 'put', 'delete']);
const HTTP_WITH_BODY = new Set(['post', 'put', 'patch']);

function pathParamNames(template: string): string[] {
  const names: string[] = [];
  for (const match of template.matchAll(/\{([^}]+)\}/g)) {
    names.push(match[1]);
  }
  return names;
}

function main(): void {
  const { spec, allowed } = readSpecAndAllowlist(openapiPath, allowlistPath);
  const apiSpec = spec as OpenAPISpec;

  const tools = allowed.map((entry) => {
    const [method, ...pathParts] = String(entry).split(/\s+/);
    const pathTemplate = pathParts.join(' ');
    const httpMethodLower = method.toLowerCase();
    const operationKey = `${method.toUpperCase()} ${pathTemplate}`;
    const pathItemRoot = spec.paths?.[pathTemplate];
    if (!pathItemRoot || typeof pathItemRoot !== 'object') {
      throw new Error(`OpenAPI paths missing "${pathTemplate}"`);
    }
    const openApiOp = pathItemRoot[httpMethodLower];
    if (!openApiOp || typeof openApiOp !== 'object') {
      throw new Error(`OpenAPI missing ${method.toUpperCase()} ${pathTemplate}`);
    }

    const name = toolNameFromOperation(httpMethodLower, pathTemplate);
    const write = WRITE_METHODS.has(httpMethodLower);
    const wantsBody =
      HTTP_WITH_BODY.has(httpMethodLower) && Boolean(openApiOp.requestBody);

    const inputSchema = buildInputJsonSchema({
      spec: apiSpec,
      operation: openApiOp,
      pathItem: pathItemRoot,
      pathTemplate,
      httpMethodLower,
      includeIdempotencyKey: write,
    });

    const summary =
      typeof openApiOp.summary === 'string' && openApiOp.summary.length > 0
        ? openApiOp.summary
        : name;
    const description =
      typeof openApiOp.description === 'string'
        ? openApiOp.description
        : summary;

    return {
      name,
      operationKey,
      method: method.toUpperCase(),
      pathTemplate,
      pathParamNames: pathParamNames(pathTemplate),
      queryParamNames: [] as string[],
      title: summary,
      description,
      tags: openApiOp.tags ?? ['Provisioning'],
      operationId: openApiOp.operationId ?? name,
      write,
      wantsBody,
      inputSchema,
      readOnly: !write,
      destructive: false,
      alwaysLoad: name.includes('post_provisioning_v1_accounts'),
      searchHint: 'provisioning onboarding merchant account',
      authMode: 'provisioning' as const,
    };
  });

  const manifest = {
    manifestVersion: 1 as const,
    apiVersion: spec.info?.version ?? '1.1.0',
    apiTitle: 'lomi. Provisioning API',
    toolCount: tools.length,
    tools,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  console.log(
    `Provisioning MCP manifest written (${tools.length} tools) to ${outFile}`,
  );
}

main();
