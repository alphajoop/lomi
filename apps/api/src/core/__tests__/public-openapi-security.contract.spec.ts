import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPublicRestApiOperation } from '../../../../docs/lib/scripts/manual-api/constants';

const FORBIDDEN_OPENAPI_EXACT_PATHS = ['/me'] as const;

const FORBIDDEN_OPENAPI_PREFIXES = [
  '/internal/',
  '/dashboard/',
  '/agent/',
  '/cli/',
  '/checkout/v1/',
  '/customer-portal/',
  '/payments/gim',
  '/webhooks/stripe',
  '/webhooks/wave',
  '/webhooks/mtn',
  '/webhooks/spi',
  '/invoices',
] as const;

function readExportedOpenApi(): {
  paths: Record<string, Record<string, { operationId?: string }>>;
} {
  const openapiPath = join(__dirname, '../../../../docs/openapi.json');
  return JSON.parse(readFileSync(openapiPath, 'utf8')) as {
    paths: Record<string, Record<string, { operationId?: string }>>;
  };
}

describe('Public OpenAPI security (contract)', () => {
  const document = readExportedOpenApi();

  it('does not export internal, dashboard, agent, or provider ingress routes', () => {
    for (const pathKey of Object.keys(document.paths)) {
      expect(
        (FORBIDDEN_OPENAPI_EXACT_PATHS as readonly string[]).includes(pathKey),
      ).toBe(false);
      for (const prefix of FORBIDDEN_OPENAPI_PREFIXES) {
        expect(pathKey.startsWith(prefix)).toBe(false);
      }
    }
  });

  it('only exports operations on the public merchant allowlist', () => {
    for (const [pathKey, pathItem] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (method === 'parameters' || !operation?.operationId) continue;
        expect(isPublicRestApiOperation(method, pathKey)).toBe(true);
      }
    }
  });

  it('exports the unified logs API without legacy admin-only surfaces', () => {
    expect(document.paths['/logs']).toBeDefined();
    expect(document.paths['/logs/{type}/{id}']).toBeDefined();
    expect(document.paths['/internal/logs']).toBeUndefined();
    expect(document.paths['/admin/logs']).toBeUndefined();
  });
});
