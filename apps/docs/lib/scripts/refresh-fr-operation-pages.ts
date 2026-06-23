/* @proprietary license */

/**
 * Regenerates selected `.fr.mdx` REST reference pages from OpenAPI + FR guidance overrides.
 * Run from apps/docs: `pnpm exec tsx lib/scripts/refresh-fr-operation-pages.ts`
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPublicRestApiOperation, pathToFolder } from '@/lib/scripts/manual-api/constants';
import {
  collectPublicOperations,
  renderOperationPageMdx,
} from '@/lib/scripts/manual-api/render-operation-mdx';

const DOCS_API_ROOT = join(process.cwd(), 'content/docs/api');

/** Operation IDs with known EN/FR heading drift (guidance blocks). */
const OPERATION_IDS = [
  'AccountsController_checkAvailableBalance',
  'ChargesController_cancelCardCharge',
  'ChargesController_createCardCharge',
  'ChargesController_createWaveCharge',
  'ChargesController_getCardCharge',
  'CheckoutSessionsController_create',
  'CheckoutSessionsController_findAll',
  'CheckoutSessionsController_findOne',
  'CustomersController_create',
  'CustomersController_findOne',
  'CustomersController_getTransactions',
  'CustomersController_remove',
  'DiscountCouponsController_create',
  'DiscountCouponsController_getPerformance',
  'PaymentLinksController_create',
  'PaymentRequestsController_create',
  'PayoutsUnifiedController_create',
  'PayoutsUnifiedController_findAll',
  'PayoutsUnifiedController_findOne',
  'ProductsController_addPrice',
  'ProductsController_create',
  'ProductsController_setDefaultPrice',
  'RefundsController_findAll',
  'RefundsController_findOne',
  'SubscriptionsController_cancel',
  'SubscriptionsController_findByCustomer',
  'TransactionsController_findAll',
  'WebhookDeliveryLogsController_findAll',
  'WebhooksController_update',
] as const;

async function main(): Promise<void> {
  const specPath = join(process.cwd(), 'openapi.json');
  const raw = readFileSync(specPath, 'utf-8');
  const spec = JSON.parse(raw) as Parameters<typeof collectPublicOperations>[0];
  const schemaComponents = (
    spec as { components?: { schemas?: Record<string, unknown> } }
  ).components?.schemas;

  const byId = new Map(
    collectPublicOperations(spec)
      .filter((o) => isPublicRestApiOperation(o.method, o.path))
      .map((o) => [o.operationId, o] as const),
  );

  let wrote = 0;
  for (const operationId of OPERATION_IDS) {
    const entry = byId.get(operationId);
    if (!entry) {
      console.warn(`skip ${operationId}: not in public OpenAPI`);
      continue;
    }

    const { method, path: routePath, operation } = entry;
    const rawPathItem = spec.paths?.[routePath] as
      | { parameters?: unknown[] }
      | undefined;

    const mdxFr = renderOperationPageMdx({
      method,
      path: routePath,
      operationId,
      operation,
      pathItem: rawPathItem as Parameters<
        typeof renderOperationPageMdx
      >[0]['pathItem'],
      components: {
        schemas: schemaComponents as Parameters<
          typeof renderOperationPageMdx
        >[0]['components'] extends { schemas?: infer TSchemas }
          ? TSchemas
          : never,
      },
      lang: 'fr',
    });

    const folder = pathToFolder(routePath);
    const filePathFr = join(DOCS_API_ROOT, folder, `${operationId}.fr.mdx`);
    if (!existsSync(filePathFr)) {
      console.warn(`skip ${operationId}: missing ${filePathFr}`);
      continue;
    }

    writeFileSync(filePathFr, `${mdxFr.trim()}\n`, 'utf-8');
    wrote += 1;
    console.log(`refreshed ${filePathFr}`);
  }

  console.log(`Done: refreshed ${wrote} French operation pages.`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
