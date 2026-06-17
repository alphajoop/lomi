/* @proprietary license */

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'tinyglobby';
import { isPublicRestApiOperation } from '@/lib/scripts/manual-api/constants';
import { collectPublicOperations } from '@/lib/scripts/manual-api/render-operation-mdx';

const DOCS_ROOT = process.cwd();
const CONTENT_ROOT = path.join(DOCS_ROOT, 'content/docs');

const BILINGUAL_PREFIXES = [
  'start/',
  'build/guides/',
  'build/payment-methods/',
] as const;

const LLMS_REQUIRED_SLUGS = [
  'start/integration-journey',
  'build/guides/verify-payments',
  'build/guides/payment-lifecycle',
  'build/guides/payment-methods',
  'api/payment-state-machine',
] as const;

const INTERNAL_LINK_RE =
  /\]\(\/(start|build|api|resources)\/([^)\s#]+)/g;

function slugFromMdxFile(relativeToContent: string): string {
  const withoutExt = relativeToContent.replace(/\.mdx$/, '');
  return withoutExt.replace(/\.fr$/, '');
}

async function collectValidSlugs(): Promise<Set<string>> {
  const files = await glob('**/*.mdx', { cwd: CONTENT_ROOT });
  const slugs = new Set<string>();

  const addSlug = (slug: string) => {
    slugs.add(slug);
    if (slug.endsWith('/index')) {
      slugs.add(slug.slice(0, -'/index'.length));
    }
  };

  for (const file of files) {
    addSlug(slugFromMdxFile(file));
  }

  for (const segment of ['start', 'build', 'api', 'resources']) {
    const dirs = await glob(`${segment}/*`, {
      cwd: CONTENT_ROOT,
      onlyDirectories: true,
    });
    for (const dir of dirs) {
      addSlug(dir.replace(/\\/g, '/'));
    }
  }

  return slugs;
}

async function checkOpenApiParity(errors: string[]): Promise<void> {
  const openApiPath = path.join(DOCS_ROOT, 'openapi.json');
  const raw = await fs.readFile(openApiPath, 'utf-8');
  const spec = JSON.parse(raw) as Parameters<typeof collectPublicOperations>[0];

  const operations = collectPublicOperations(spec).filter((o) =>
    isPublicRestApiOperation(o.method, o.path),
  );

  const expected = new Set(
    operations.map((o) => `${o.method.toUpperCase()} ${o.path}`),
  );

  const docFiles = (await glob('content/docs/api/*/*.mdx', { cwd: DOCS_ROOT })).filter(
    (file) => !/\/index(?:\.fr)?\.mdx$/.test(file),
  );

  const documented = new Set<string>();

  for (const file of docFiles) {
    const content = await fs.readFile(path.join(DOCS_ROOT, file), 'utf-8');
    const methodMatch = /^method:\s*(\S+)/m.exec(content);
    const pathMatch = /^path:\s*(.+)$/m.exec(content);
    if (!methodMatch || !pathMatch) continue;
    const routePath = pathMatch[1].trim().replace(/^['"]|['"]$/g, '');
    documented.add(`${methodMatch[1].toUpperCase()} ${routePath}`);
  }

  for (const op of expected) {
    if (!documented.has(op)) {
      errors.push(`OpenAPI operation missing MDX: ${op}`);
    }
  }

  for (const op of documented) {
    if (!expected.has(op)) {
      errors.push(`MDX documents unknown or non-public OpenAPI operation: ${op}`);
    }
  }
}

async function checkBilingualSiblings(errors: string[]): Promise<void> {
  const files = await glob('**/*.mdx', { cwd: CONTENT_ROOT });

  for (const file of files) {
    const normalized = file.replace(/\\/g, '/');
    if (!BILINGUAL_PREFIXES.some((p) => normalized.startsWith(p))) continue;
    if (normalized.endsWith('.fr.mdx')) continue;

    const frSibling = normalized.replace(/\.mdx$/, '.fr.mdx');
    if (!files.includes(frSibling)) {
      errors.push(`Missing French sibling: ${frSibling} (for ${normalized})`);
    }
  }
}

async function checkInternalLinks(
  errors: string[],
  validSlugs: Set<string>,
): Promise<void> {
  const files = await glob(
    [
      'content/docs/start/integration-journey*.mdx',
      'content/docs/build/choose-integration*.mdx',
      'content/docs/build/guides/**/*.mdx',
      'content/docs/build/payment-methods/**/*.mdx',
    ],
    { cwd: DOCS_ROOT },
  );

  for (const file of files) {
    const content = await fs.readFile(path.join(DOCS_ROOT, file), 'utf-8');
    const matches = content.matchAll(INTERNAL_LINK_RE);
    for (const match of matches) {
      const slug = `${match[1]}/${match[2]}`;
      if (!validSlugs.has(slug)) {
        errors.push(`Dead internal link in ${file}: /${slug}`);
      }
    }
  }
}

async function checkLlmsTxtRoute(errors: string[]): Promise<void> {
  const routePath = path.join(DOCS_ROOT, 'app/llms.txt/route.ts');
  const source = await fs.readFile(routePath, 'utf-8');

  for (const slug of LLMS_REQUIRED_SLUGS) {
    if (!source.includes(slug)) {
      errors.push(`llms.txt route.ts does not reference slug: ${slug}`);
    }
  }
}

async function main(): Promise<void> {
  const errors: string[] = [];
  const validSlugs = await collectValidSlugs();

  await checkOpenApiParity(errors);
  await checkBilingualSiblings(errors);
  await checkInternalLinks(errors, validSlugs);
  await checkLlmsTxtRoute(errors);

  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    throw new Error(`Docs drift check failed (${errors.length} issue(s)).`);
  }

  console.log('Docs drift checks passed.');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
