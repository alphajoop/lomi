/* @proprietary license */

/**
 * Emits agent-only OpenAPI JSON for machine-readable agent contracts.
 *
 * Run from `apps/api`: `pnpm run openapi:export:agent`
 * Writes to `apps/docs/agent-openapi.json`.
 */

import { writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AgentOpenApiExportModule } from '../../agent-open-api-export.module';
import { buildSwaggerDocumentBase } from '../../swagger.config';

function resolveDocsAgentOpenApiPath(): string {
  return path.resolve(process.cwd(), '../docs/agent-openapi.json');
}

function stripAgentAndProvisioningPaths(document: OpenAPIObject): OpenAPIObject {
  if (!document.paths) return document;
  const paths: OpenAPIObject['paths'] = {};

  for (const [pathKey, pathItem] of Object.entries(document.paths)) {
    if (!pathKey.startsWith('/agent') && !pathKey.startsWith('/provisioning')) {
      continue;
    }
    paths[pathKey] = pathItem;
  }

  return { ...document, paths };
}

function collectComponentSchemaRefs(value: unknown, refs: Set<string>): void {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) collectComponentSchemaRefs(item, refs);
    return;
  }

  const record = value as Record<string, unknown>;
  const ref = record.$ref;
  if (typeof ref === 'string' && ref.startsWith('#/components/schemas/')) {
    refs.add(decodeURIComponent(ref.slice('#/components/schemas/'.length)));
  }

  for (const child of Object.values(record)) {
    collectComponentSchemaRefs(child, refs);
  }
}

function pruneUnusedOpenApiComponentSchemas(
  document: OpenAPIObject,
): OpenAPIObject {
  const schemas = document.components?.schemas;
  if (!schemas) return document;

  const used = new Set<string>();
  collectComponentSchemaRefs(document.paths, used);

  let changed = true;
  while (changed) {
    changed = false;
    for (const schemaName of Array.from(used)) {
      const before = used.size;
      collectComponentSchemaRefs(schemas[schemaName], used);
      changed = changed || used.size !== before;
    }
  }

  const nextSchemas = Object.fromEntries(
    Object.entries(schemas).filter(([schemaName]) => used.has(schemaName)),
  );

  return {
    ...document,
    components: {
      ...document.components,
      schemas: nextSchemas,
    },
  };
}

async function exportAgentOpenApi(): Promise<void> {
  const expressApp = express();
  expressApp.use(express.json({ limit: '10mb' }));

  const app = await NestFactory.create(
    AgentOpenApiExportModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn'],
      bodyParser: false,
    },
  );

  const builderResult = buildSwaggerDocumentBase();
  const document = pruneUnusedOpenApiComponentSchemas(
    stripAgentAndProvisioningPaths(SwaggerModule.createDocument(app, builderResult)),
  );

  document.servers = [
    { url: 'https://api.lomi.africa', description: 'Live' },
    { url: 'https://sandbox.api.lomi.africa', description: 'Test' },
  ];
  document.tags = [{ name: 'Agent' }, { name: 'Provisioning' }];

  const outPath = resolveDocsAgentOpenApiPath();
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');
  console.log(`Agent OpenAPI written to ${outPath}`);

  await app.close();
}

void exportAgentOpenApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
