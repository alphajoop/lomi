import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPublicRestApiOperation } from '../../../../docs/lib/scripts/manual-api/constants';

const METERING_OPERATION_IDS = [
  'MetersController_create',
  'MetersController_findAll',
  'MetersController_update',
  'MetersController_findOne',
  'MetersController_getBalance',
  'UsageEventsController_findAll',
  'UsageEventsController_ingest',
  'UsageEventsController_findOne',
  'UsageEventsController_createUsageSubscription',
  'UsageBillingController_listPeriods',
  'UsageBillingController_getSubscriptionUsage',
  'UsageBillingController_getRevenue',
  'UsageBillingController_creditWallet',
  'UsageBillingController_createEntitlement',
  'UsageBillingController_checkEntitlement',
] as const;

const METERING_PATH_PREFIXES = ['/meters', '/usage-events', '/usage-subscriptions', '/usage-billing'];

function readExportedOpenApi(): {
  paths: Record<string, Record<string, { operationId?: string }>>;
} {
  const openapiPath = join(__dirname, '../../../../docs/openapi.json');
  return JSON.parse(readFileSync(openapiPath, 'utf8')) as {
    paths: Record<string, Record<string, { operationId?: string }>>;
  };
}

function collectOperationIds(document: ReturnType<typeof readExportedOpenApi>): Set<string> {
  const ids = new Set<string>();
  for (const [pathKey, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === 'parameters' || !operation?.operationId) continue;
      ids.add(operation.operationId);
    }
  }
  return ids;
}

describe('Metering OpenAPI export (contract)', () => {
  const document = readExportedOpenApi();
  const operationIds = collectOperationIds(document);

  it('exports all public metering operationIds', () => {
    for (const id of METERING_OPERATION_IDS) {
      expect(operationIds.has(id)).toBe(true);
    }
  });

  it('only includes metering paths that are on the public REST allowlist', () => {
    for (const pathKey of Object.keys(document.paths)) {
      if (!METERING_PATH_PREFIXES.some((prefix) => pathKey.startsWith(prefix))) {
        continue;
      }
      for (const [method, operation] of Object.entries(document.paths[pathKey])) {
        if (method === 'parameters' || !operation?.operationId) continue;
        expect(isPublicRestApiOperation(method, pathKey)).toBe(true);
      }
    }
  });

  it('does not export internal usage-billing routes', () => {
    for (const pathKey of Object.keys(document.paths)) {
      expect(pathKey.startsWith('/internal/usage-billing')).toBe(false);
    }
  });
});
