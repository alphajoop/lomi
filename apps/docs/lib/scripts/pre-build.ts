/* @proprietary license */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rimraf } from 'rimraf';
import type { Document } from '@/lib/openapi/types';
import { buildRegistry } from '@/lib/scripts/build-registry';
import { normalizeOpenApiSecurity } from '@/lib/openapi/security-normalize';

const LEGACY_OPENAPI_OUTPUT = './content/docs/openapi';

function resolveApiRoot(): string | null {
  const candidates = [
    process.env.DOCS_API_ROOT,
    path.resolve(process.cwd(), '..', 'api'),
    path.resolve(process.cwd(), '..', '..', 'apps', 'api'),
    path.resolve(process.cwd(), 'apps', 'api'),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
  }

  return null;
}

function exportOpenApiFromNest(): void {
  const apiRoot = resolveApiRoot();
  if (!apiRoot) {
    console.warn(
      'Could not locate apps/api; skipping OpenAPI export and using checked-in apps/docs/openapi.json.',
    );
    return;
  }

  try {
    execSync('pnpm run openapi:export', { cwd: apiRoot, stdio: 'inherit' });
  } catch (error) {
    console.warn(
      'OpenAPI export from apps/api failed; continuing with checked-in apps/docs/openapi.json:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function normalizeOpenApiSecurityFile(): Promise<void> {
  const openApiPath = path.resolve(process.cwd(), 'openapi.json');
  if (!existsSync(openApiPath)) return;

  const raw = await readFile(openApiPath, 'utf-8');
  const spec = JSON.parse(raw) as Document;
  const normalized = normalizeOpenApiSecurity(spec);
  await writeFile(
    openApiPath,
    `${JSON.stringify(normalized, null, 2)}\n`,
    'utf-8',
  );
}

async function refreshOpenApiArtifacts(): Promise<void> {
  exportOpenApiFromNest();
  await normalizeOpenApiSecurityFile();
  /** Old Fumadocs OpenAPI tree; REST reference is maintained under content/docs/api. */
  await rimraf(LEGACY_OPENAPI_OUTPUT);
}

/** When unset/false, docs build uses the committed `openapi.json` only (no export, no normalize). */
function isOpenApiSyncOptedIn(): boolean {
  return process.env.DOCS_SYNC_OPENAPI === '1';
}

async function main() {
  try {
    await buildRegistry();
  } catch (error) {
    console.warn(
      'Registry build failed, but continuing:',
      error instanceof Error ? error.message : String(error),
    );
  }

  if (isOpenApiSyncOptedIn()) {
    await refreshOpenApiArtifacts();
  } else {
    console.log(
      '[docs pre-build] Skipping OpenAPI export/sync (using committed openapi.json). Set DOCS_SYNC_OPENAPI=1 to run apps/api openapi:export + security normalize (see api-reference-authoring).',
    );
  }
}

await main().catch((e) => {
  console.error('Failed to run pre build script', e);
  process.exit(1);
});
