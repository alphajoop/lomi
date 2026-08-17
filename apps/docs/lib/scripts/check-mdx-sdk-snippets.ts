/* @proprietary license */

/**
 * Validates `lomi.<service>.<method>(...)` calls in TypeScript fences against
 * apps/sdks/ts/src/generated/sdk-public-methods.json (produced by SDK codegen).
 */

import { glob } from 'tinyglobby';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isJsonObject } from '@lomi./shared';

type Manifest = {
  generatedAt?: string;
  sdk: Record<string, string[]>;
};

function extractTsFences(source: string): string[] {
  const out: string[] = [];
  const re = /```(?:typescript|ts)\r?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    out.push(m[1] ?? '');
  }
  return out;
}

async function main(): Promise<void> {
  const manifestPath = path.resolve(
    process.cwd(),
    '..',
    'sdks',
    'ts',
    'src',
    'generated',
    'sdk-public-methods.json',
  );
  const raw = await fs.readFile(manifestPath, 'utf-8').catch(() => {
    throw new Error(
      `Missing ${manifestPath}. Run \`node scripts/typescript-generate.js\` from apps/sdks first.`,
    );
  });
  // SAFETY: Boundary value matches the asserted domain type at this call site.
  const manifest = JSON.parse(raw) as Manifest;
  const sdk = manifest.sdk;
  if (!isJsonObject(sdk)) {
    throw new Error('sdk-public-methods.json: missing "sdk" object');
  }

  const files = await glob('content/docs/**/*.mdx');
  const errors: string[] = [];

  const callRe = /\blomi\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*\(/g;

  for (const file of files) {
    const text = await fs.readFile(path.resolve(file), 'utf-8');
    for (const fence of extractTsFences(text)) {
      let m: RegExpExecArray | null;
      while ((m = callRe.exec(fence)) !== null) {
        const prop = m[1];
        const method = m[2];
        const allowed = sdk[prop];
        if (!allowed) {
          errors.push(
            `${file}: unknown LomiSDK service "${prop}" in lomi.${prop}.${method}(...)`,
          );
          continue;
        }
        if (!allowed.includes(method)) {
          errors.push(
            `${file}: invalid call lomi.${prop}.${method}(...) — valid: ${allowed.join(', ')}`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    throw new Error(
      `MDX SDK snippet contract failed (${errors.length} issue(s)).`,
    );
  }
  console.log('MDX SDK snippet contract checks passed.');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
