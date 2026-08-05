/**
 * Assert _expected-public-operations.json matches filtered merchant OpenAPI.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { isPublicRestApiOperation } from '@/lib/scripts/manual-api/constants';
import { collectPublicOperations } from '@/lib/scripts/manual-api/render-operation-mdx';

const DOCS_ROOT = path.join(process.cwd());

export async function checkAllowlistParity(errors: string[]): Promise<void> {
  const openApiPath = path.join(DOCS_ROOT, 'openapi.json');
  const expectedPath = path.join(
    DOCS_ROOT,
    'lib/scripts/manual-api/_expected-public-operations.json',
  );

  const raw = await fs.readFile(openApiPath, 'utf-8');
  const spec = JSON.parse(raw) as Parameters<typeof collectPublicOperations>[0];

  const fromOpenApi = collectPublicOperations(spec)
    .filter((o) => isPublicRestApiOperation(o.method, o.path))
    .map((o) => `${o.method.toUpperCase()} ${o.path}`)
    .sort();

  const expectedRaw = await fs.readFile(expectedPath, 'utf-8');
  const expected = (JSON.parse(expectedRaw) as string[]).slice().sort();

  const fromSet = new Set(fromOpenApi);
  const expectedSet = new Set(expected);

  for (const op of fromOpenApi) {
    if (!expectedSet.has(op)) {
      errors.push(
        `Allowlist missing operation (run api:bootstrap with CONFIRM_BOOTSTRAP=1): ${op}`,
      );
    }
  }
  for (const op of expected) {
    if (!fromSet.has(op)) {
      errors.push(`Allowlist has stale operation not in public OpenAPI: ${op}`);
    }
  }
}
