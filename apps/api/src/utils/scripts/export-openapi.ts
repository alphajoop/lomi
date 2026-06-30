/* @proprietary license */

/**
 * Bootstraps the Nest app (same Express middleware stack as production),
 * emits OpenAPI JSON for Fumadocs, then exits.
 *
 * Run from `apps/api`: `pnpm run openapi:export`
 * Writes to `apps/docs/openapi.json`.
 */

import { writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { OpenApiExportModule } from '../../open-api-export.module';
import { buildSwaggerDocumentBase } from '../../swagger.config';
import { isPublicRestApiOperation } from '../../../../docs/lib/scripts/manual-api/constants';

function resolveDocsOpenApiPath(): string {
  // Run with cwd `apps/api` (see package.json script).
  return path.resolve(process.cwd(), '../docs/openapi.json');
}

/** Paths registered for infra / smoke tests, not merchant HTTP API surface. */
const OPENAPI_NOISE_PATHS = new Set([
  '/',
  '/robots.txt',
  '/favicon.ico',
  '/favicon.png',
  '/test/webhook-event',
]);

function stripNoiseOpenApiPaths(document: OpenAPIObject): OpenAPIObject {
  if (!document.paths) return document;
  const paths = { ...document.paths };
  for (const p of OPENAPI_NOISE_PATHS) {
    delete paths[p];
  }
  return { ...document, paths };
}

function stripNonPublicRestApiPaths(document: OpenAPIObject): OpenAPIObject {
  if (!document.paths) return document;
  const paths: Record<string, unknown> = {};

  for (const [pathKey, pathItem] of Object.entries(document.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    const filteredPathItem: Record<string, unknown> = {};
    for (const [method, operation] of Object.entries(
      pathItem as Record<string, unknown>,
    )) {
      if (method === 'parameters') {
        filteredPathItem[method] = operation;
        continue;
      }

      if (isPublicRestApiOperation(method, pathKey)) {
        filteredPathItem[method] = operation;
      }
    }

    const hasOperation = Object.keys(filteredPathItem).some(
      (key) => key !== 'parameters',
    );
    if (hasOperation) {
      paths[pathKey] = filteredPathItem;
    }
  }

  return { ...document, paths: paths as OpenAPIObject['paths'] };
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

function getPublicOperationTag(pathKey: string): string | undefined {
  if (pathKey.startsWith('/accounts/balance')) return 'Balances';
  if (pathKey.startsWith('/charge/')) return 'Advanced Direct Charges';
  if (pathKey.startsWith('/checkout-sessions')) return 'Checkout Sessions';
  if (pathKey.startsWith('/payment-links')) return 'Payment Links';
  if (pathKey.startsWith('/payment-requests')) return 'Payment Requests';
  if (pathKey.startsWith('/customers')) return 'Customers';
  if (pathKey.startsWith('/products')) return 'Products';
  if (pathKey.startsWith('/subscriptions')) return 'Subscriptions';
  if (pathKey.startsWith('/customer-subscriptions')) return 'Subscriptions';
  if (pathKey.startsWith('/discount-coupons')) return 'Discount Coupons';
  if (pathKey.startsWith('/refunds')) return 'Refunds';
  if (pathKey.startsWith('/payouts')) return 'Payouts';
  if (pathKey.startsWith('/transactions')) return 'Transactions';
  if (pathKey.startsWith('/webhooks')) return 'Webhooks';
  if (pathKey.startsWith('/webhook-delivery-logs')) return 'Webhooks';
  if (pathKey.startsWith('/logs')) return 'Logs';
  if (pathKey.startsWith('/meters')) return 'Meters';
  if (
    pathKey.startsWith('/usage-events') ||
    pathKey.startsWith('/usage-subscriptions')
  ) {
    return 'Usage events';
  }
  if (pathKey.startsWith('/usage-billing')) return 'Usage billing';
  return undefined;
}

function normalizePublicOperationTags(document: OpenAPIObject): OpenAPIObject {
  if (!document.paths) return document;
  const paths: Record<string, unknown> = {};
  const tagNames = new Set<string>();

  for (const [pathKey, pathItem] of Object.entries(document.paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      paths[pathKey] = pathItem;
      continue;
    }

    const publicTag = getPublicOperationTag(pathKey);
    const nextPathItem: Record<string, unknown> = {};

    for (const [method, operation] of Object.entries(
      pathItem as Record<string, unknown>,
    )) {
      if (
        publicTag &&
        operation &&
        typeof operation === 'object' &&
        method !== 'parameters'
      ) {
        nextPathItem[method] = {
          ...(operation as Record<string, unknown>),
          tags: [publicTag],
        };
        tagNames.add(publicTag);
      } else {
        nextPathItem[method] = operation;
      }
    }

    paths[pathKey] = nextPathItem;
  }

  return {
    ...document,
    paths: paths as OpenAPIObject['paths'],
    tags: Array.from(tagNames)
      .sort()
      .map((name) => ({ name })),
  };
}

/** Provider ingress — must never ship in the public merchant OpenAPI artifact. */
const FORBIDDEN_PROVIDER_INGRESS_PATHS = [
  '/webhooks/stripe',
  '/webhooks/wave',
] as const;

function assertNoForbiddenProviderIngressPaths(document: {
  paths?: Record<string, unknown>;
}): void {
  if (!document.paths) return;
  for (const pathKey of Object.keys(document.paths)) {
    if (
      (FORBIDDEN_PROVIDER_INGRESS_PATHS as readonly string[]).includes(pathKey)
    ) {
      throw new Error(
        `Public OpenAPI must not include provider ingress path "${pathKey}". Keep provider modules out of OpenApiExportModule / webhooks-open-api.module.`,
      );
    }
  }
}

function attachExpressMiddleware(expressApp: express.Express) {
  expressApp.use(
    '/webhooks',
    express.raw({ type: 'application/json', limit: '10mb' }),
    (req, res, next) => {
      (req as express.Request & { rawBody?: unknown }).rawBody = req.body;
      next();
    },
  );
  expressApp.use(express.json({ limit: '10mb' }));
}

async function exportOpenApi(): Promise<void> {
  const expressApp = express();
  attachExpressMiddleware(expressApp);

  const app = await NestFactory.create(
    OpenApiExportModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn'],
      bodyParser: false,
    },
  );

  const builderResult = buildSwaggerDocumentBase();
  const document = normalizePublicOperationTags(
    pruneUnusedOpenApiComponentSchemas(
      stripNonPublicRestApiPaths(
        stripNoiseOpenApiPaths(
          SwaggerModule.createDocument(app, builderResult),
        ),
      ),
    ),
  );

  assertNoForbiddenProviderIngressPaths(document);

  document.servers = [
    { url: 'https://api.lomi.africa', description: 'Live' },
    { url: 'https://sandbox.api.lomi.africa', description: 'Test' },
  ];

  const outPath = resolveDocsOpenApiPath();
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');
  console.log(`OpenAPI written to ${outPath}`);

  await app.close();
}

void exportOpenApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
