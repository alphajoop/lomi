/* @proprietary license */

import { glob } from 'tinyglobby';
import { printErrors, scanURLs, validateFiles } from 'next-validate-link';
import { createGetUrl, getSlugs } from 'fumadocs-core/source';
import { TOCItemType } from 'fumadocs-core/toc';
import fs from 'node:fs/promises';
import path from 'node:path';
import { remarkInclude } from 'fumadocs-mdx/config';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import { remark } from 'remark';
import { remarkHeading } from 'fumadocs-core/mdx-plugins';
import { isPublicRestApiOperation } from '@/lib/scripts/manual-api/constants';
import { collectPublicOperations } from '@/lib/scripts/manual-api/render-operation-mdx';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

type JsonObject = Record<string, unknown>;

/** Guardrails for public REST docs tone (source: openapi.json from Nest @ApiOperation). */
const OPENAPI_DESCRIPTION_BANNED: { test: RegExp; hint: string }[] = [
  {
    test: /not removed from the database/i,
    hint: 'Avoid storage implementation detail (e.g. say the resource no longer appears in list/get).',
  },
  {
    test: /pre-calculated and stored in the database/i,
    hint: 'Describe the metrics returned, not how they are stored.',
  },
  {
    test: /only accessible if the .+ belongs to your organization/i,
    hint: 'Prefer: “Responds with 404 if … not available for this API key.”',
  },
  {
    test: /soft deletes? a/i,
    hint: 'Describe customer-visible behavior, not “soft delete” / DB details.',
  },
  {
    test: /marked as deleted but not removed/i,
    hint: 'Same as soft-delete: describe API behavior, not row state.',
  },
];

/** Detect obvious leftover English in French-target OpenAPI strings. */
const OPENAPI_ENGLISH_RESIDUAL: { test: RegExp; hint: string }[] = [
  {
    test: /\bInvalid or missing API key\b/i,
    hint: 'Traduire : « Clé API invalide ou manquante ».',
  },
  {
    test: /\bnot found or access denied\b/i,
    hint: 'Traduire : « introuvable ou accès refusé ».',
  },
  {
    test: /\bReturns all\b/i,
    hint: "Traduire les descriptions d'opération (ex. « Renvoie tous les … »).",
  },
  {
    test: /\bList all\b/i,
    hint: 'Traduire les résumés (ex. « Lister les … »).',
  },
  {
    test: /\bCreated successfully\b/i,
    hint: 'Traduire : « créé avec succès ».',
  },
];

function collectOpenApiEnglishResidual(
  spec: JsonObject,
  errors: string[],
): void {
  const infos = spec.info;
  if (infos && typeof infos === 'object' && 'description' in infos) {
    const d = (infos as { description?: unknown }).description;
    if (typeof d === 'string') {
      for (const { test, hint } of OPENAPI_ENGLISH_RESIDUAL) {
        if (test.test(d)) {
          errors.push(
            `openapi.json info.description: probable English (${hint})`,
          );
        }
      }
    }
  }

  if (!spec.paths || typeof spec.paths !== 'object') return;

  for (const [p, item] of Object.entries(
    spec.paths as Record<string, unknown>,
  )) {
    if (!item || typeof item !== 'object') continue;
    const pathItem = item as JsonObject;
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;
      const operation = op as JsonObject;
      for (const field of ['summary', 'description'] as const) {
        const text = operation[field];
        if (typeof text !== 'string') continue;
        for (const { test, hint } of OPENAPI_ENGLISH_RESIDUAL) {
          if (test.test(text)) {
            errors.push(
              `openapi.json ${method.toUpperCase()} ${p} ${field}: probable English (${hint})`,
            );
          }
        }
      }
    }
  }
}

function collectOpenApiTextErrors(spec: JsonObject, errors: string[]): void {
  if (!spec.paths || typeof spec.paths !== 'object') return;

  for (const [p, item] of Object.entries(
    spec.paths as Record<string, unknown>,
  )) {
    if (!item || typeof item !== 'object') continue;
    const pathItem = item as JsonObject;
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;
      const operation = op as JsonObject;
      for (const field of ['summary', 'description'] as const) {
        const text = operation[field];
        if (typeof text !== 'string') continue;
        for (const { test, hint } of OPENAPI_DESCRIPTION_BANNED) {
          if (test.test(text)) {
            errors.push(
              `openapi.json ${method.toUpperCase()} ${p} ${field}: banned phrasing (${hint})`,
            );
          }
        }
      }
    }
  }
}

/** Provider ingress routes must not appear in the committed public OpenAPI contract. */
const FORBIDDEN_PUBLIC_OPENAPI_PATHS = new Set([
  '/accounts',
  '/accounts/{id}',
  '/webhooks/stripe',
  '/webhooks/wave',
]);

const FORBIDDEN_PUBLIC_OPENAPI_PREFIXES = ['/agent/'] as const;

function collectForbiddenProviderIngressOpenApiPaths(
  spec: JsonObject,
  errors: string[],
): void {
  if (!spec.paths || typeof spec.paths !== 'object') return;
  for (const pathKey of Object.keys(spec.paths as Record<string, unknown>)) {
    if (
      FORBIDDEN_PUBLIC_OPENAPI_PATHS.has(pathKey) ||
      FORBIDDEN_PUBLIC_OPENAPI_PREFIXES.some((prefix) =>
        pathKey.startsWith(prefix),
      )
    ) {
      errors.push(
        `openapi.json defines forbidden public path "${pathKey}"; remove it from the export graph and re-run apps/api openapi:export.`,
      );
    }
  }
}

/** After stripping fenced code blocks — narrative and tables, not examples. */
const DOCS_FORBIDDEN_INGRESS_SNIPPETS: readonly string[] = [
  '/webhooks/stripe',
  '/webhooks/wave',
];

const DOCS_FORBIDDEN_PROSE: { re: RegExp; hint: string }[] = [
  {
    re: /\bStripe\b/i,
    hint: 'Public docs must not name the underlying card processor; describe card payments generically.',
  },
  {
    re: /stripe\.com/i,
    hint: 'Remove vendor-specific links or hostnames from public docs.',
  },
  {
    re: /\bSTRIPE_[A-Z0-9_]+\b/,
    hint: 'Do not document internal card-processor env vars or secrets in public docs.',
  },
  {
    re: /stripe\|night/i,
    hint: 'Use lomi theme names (`light`, `dark`, `flat`) only — not legacy processor theme aliases.',
  },
];

/** Any string value in the committed public OpenAPI contract. */
const OPENAPI_FORBIDDEN_STRING: { test: RegExp; hint: string }[] = [
  {
    test: /\bStripe\b/i,
    hint: 'OpenAPI must not name the card processor; use generic card-payment wording.',
  },
  {
    test: /stripe\.com/i,
    hint: 'Remove vendor hostnames from OpenAPI.',
  },
  {
    test: /\bSTRIPE_[A-Z0-9_]+\b/,
    hint: 'OpenAPI must not reference card-processor env var names.',
  },
  {
    test: /stripe\|night/i,
    hint: 'Document only `light`, `dark`, `flat` theme values.',
  },
  {
    test: /"stripe"/,
    hint: 'Remove legacy processor theme enum values from the public schema.',
  },
];

function collectOpenApiForbiddenStrings(
  value: unknown,
  jsonPath: string,
  errors: string[],
): void {
  if (typeof value === 'string') {
    for (const { test, hint } of OPENAPI_FORBIDDEN_STRING) {
      if (test.test(value)) {
        errors.push(`openapi.json ${jsonPath}: ${hint}`);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) =>
      collectOpenApiForbiddenStrings(item, `${jsonPath}[${i}]`, errors),
    );
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      collectOpenApiForbiddenStrings(child, `${jsonPath}.${key}`, errors);
    }
  }
}

function stripMarkdownCodeFences(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '');
}

async function checkPublicDocsProviderIngressPolicy(): Promise<void> {
  const files = await glob('content/docs/**/*.mdx');
  const errors: string[] = [];

  for (const file of files) {
    const text = await fs.readFile(path.resolve(file), 'utf-8');
    for (const snippet of DOCS_FORBIDDEN_INGRESS_SNIPPETS) {
      if (text.includes(snippet)) {
        errors.push(
          `${file}: contains forbidden provider-ingress reference "${snippet}".`,
        );
      }
    }
    for (const token of ['StripeWebhook', 'WaveWebhook'] as const) {
      if (text.includes(token)) {
        errors.push(
          `${file}: contains internal controller identifier "${token}" — remove from public docs.`,
        );
      }
    }
    const body = stripMarkdownCodeFences(text);
    for (const { re, hint } of DOCS_FORBIDDEN_PROSE) {
      if (re.test(body)) {
        errors.push(`${file}: policy violation (${hint})`);
      }
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    throw new Error(
      `Public docs provider-ingress / vendor policy checks failed (${errors.length} issue(s)).`,
    );
  }
  console.log('Public docs provider policy checks passed.');
}

function collectOpenApiSecurityErrors(
  spec: JsonObject,
  errors: string[],
): void {
  const schemes = spec.components;
  if (
    schemes &&
    typeof schemes === 'object' &&
    'securitySchemes' in schemes &&
    schemes.securitySchemes &&
    typeof schemes.securitySchemes === 'object' &&
    'X-API-KEY' in (schemes.securitySchemes as object)
  ) {
    errors.push(
      'openapi.json: components.securitySchemes must use only the canonical name `api-key` (header `name` stays `X-API-KEY`), not a duplicate `X-API-KEY` scheme key. Normalize the committed spec (or run `DOCS_SYNC_OPENAPI=1 pnpm run build:pre:sync` in apps/docs if you intentionally sync from the API export).',
    );
  }

  const checkReqs = (where: string, reqs: unknown) => {
    if (!Array.isArray(reqs)) return;
    for (const req of reqs) {
      if (req && typeof req === 'object' && 'X-API-KEY' in (req as object)) {
        errors.push(
          `${where}: security must reference "api-key", not "X-API-KEY" as a scheme name.`,
        );
      }
    }
  };

  checkReqs('openapi.json security', spec.security);
  if (!spec.paths || typeof spec.paths !== 'object') return;

  for (const [p, item] of Object.entries(
    spec.paths as Record<string, unknown>,
  )) {
    if (!item || typeof item !== 'object') continue;
    const pathItem = item as JsonObject;
    checkReqs(`openapi.json path ${p}`, pathItem.security);
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;
      const operation = op as JsonObject;
      checkReqs(
        `openapi.json ${method.toUpperCase()} ${p}`,
        operation.security,
      );
    }
  }
}

/** Manual REST pages may use EN headings or localized FR equivalents. */
const REST_API_HEADING_ALTERNATIVES = [
  ['## Overview', '## Aperçu'],
  ['## Authentication', '## Authentification'],
  ['## Endpoint', '## Point de terminaison'],
  ['## Request', '## Requête'],
  ['## Responses', '## Réponses'],
  ['## Errors', '## Erreurs'],
  ['## Example', '## Exemple'],
  ['## OpenAPI'],
] as const;

function hasAnyHeading(
  content: string,
  alternatives: readonly string[],
): boolean {
  return alternatives.some((h) => content.includes(h));
}

async function checkRestApiManualPages(): Promise<void> {
  const openApiPath = path.resolve(process.cwd(), 'openapi.json');
  const raw = await fs.readFile(openApiPath, 'utf-8');
  const spec = JSON.parse(raw) as JsonObject;

  const operations = collectPublicOperations(
    spec as Parameters<typeof collectPublicOperations>[0],
  ).filter((o) => isPublicRestApiOperation(o.method, o.path));

  const expected = new Set(
    operations.map((o) => `${o.method.toUpperCase()} ${o.path}`),
  );

  const docFiles = (await glob('content/docs/api/*/*.mdx')).filter(
    (file) => !/\/index(?:\.fr)?\.mdx$/.test(file),
  );
  const documented = new Set<string>();
  const errors: string[] = [];

  for (const file of docFiles) {
    const parsed = await readFromPath(file);
    const method = parsed.data['method'];
    const routePath = parsed.data['path'];
    const operationId = parsed.data['operationId'];

    if (typeof method !== 'string' || typeof routePath !== 'string') {
      errors.push(
        `${file}: REST API pages must set frontmatter 'method' and 'path' (from OpenAPI).`,
      );
      continue;
    }

    if (typeof operationId !== 'string' || operationId.length === 0) {
      errors.push(
        `${file}: REST API pages must set frontmatter 'operationId'.`,
      );
    }

    const key = `${method.toUpperCase()} ${routePath}`;
    documented.add(key);

    for (const alts of REST_API_HEADING_ALTERNATIVES) {
      if (!hasAnyHeading(parsed.content, alts)) {
        errors.push(
          `${file}: missing required heading(s) — need one of: ${alts.join(' | ')}`,
        );
      }
    }
  }

  for (const op of expected) {
    if (!documented.has(op)) {
      errors.push(
        `Missing manual REST doc for OpenAPI operation: ${op}. Regenerate with: CONFIRM_BOOTSTRAP=1 pnpm run api:regenerate-rest-reference`,
      );
    }
  }

  for (const op of documented) {
    if (!expected.has(op)) {
      errors.push(
        `Manual REST doc references unknown or non-public operation: ${op}. Update or remove the page; agent routes are excluded from this section.`,
      );
    }
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    throw new Error(
      `REST API manual docs checks failed (${errors.length} issue(s)).`,
    );
  }

  console.log(
    `REST API manual docs checks passed (${documented.size} operations).`,
  );
}

async function checkOpenApiDocs(): Promise<void> {
  const openApiPath = path.resolve(process.cwd(), 'openapi.json');
  const raw = await fs.readFile(openApiPath, 'utf-8');
  const spec = JSON.parse(raw) as JsonObject;
  const errors: string[] = [];
  collectOpenApiSecurityErrors(spec, errors);
  collectForbiddenProviderIngressOpenApiPaths(spec, errors);
  collectOpenApiForbiddenStrings(spec, 'openapi.json', errors);
  collectOpenApiTextErrors(spec, errors);
  collectOpenApiEnglishResidual(spec, errors);
  if (errors.length > 0) {
    for (const e of errors) console.error(e);
    throw new Error(
      `OpenAPI docs checks failed (${errors.length} issue(s)). See ${openApiPath}`,
    );
  }
  console.log('OpenAPI docs checks passed.');
}

function parseMdxFrontmatter(content: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(content);
  if (!match) return { data: {}, content };
  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value: unknown = trimmed.slice(colon + 1).trim();
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (
      typeof value === 'string' &&
      value.startsWith('"') &&
      value.endsWith('"')
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, content: match[2] ?? '' };
}

async function readFromPath(file: string) {
  const content = await fs
    .readFile(path.resolve(file))
    .then((res) => res.toString());
  const parsed = parseMdxFrontmatter(content);

  return {
    path: file,
    data: parsed.data,
    content: parsed.content,
  };
}

function remarkIncludeId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any, file: { data: Record<string, unknown> }) => {
    (file.data.ids as string[]) ??= [];
    visit(tree, 'mdxJsxFlowElement', (element) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elem = element as any;
      if (!elem.name || !elem.attributes) return;

      const attributes = elem.attributes;
      const idAttr = attributes.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (attr: any) => attr.type === 'mdxJsxAttribute' && attr.name === 'id',
      );

      if (idAttr) {
        (file.data.ids as string[]).push(String(idAttr.value));
      }
    });
  };
}

const processor = remark()
  .use(remarkMdx)
  .use(remarkInclude)
  .use(remarkIncludeId)
  .use(remarkHeading);

async function getHeadings(path: string, content: string) {
  const ids: string[] = [];
  const result = await processor.process({
    path,
    value: content,
  });

  if ('toc' in result.data)
    ids.push(
      ...(result.data.toc as TOCItemType[]).map((item) => item.url.slice(1)),
    );

  if ('ids' in result.data) ids.push(...(result.data.ids as string[]));

  return ids;
}

async function checkLinks() {
  const docsFiles = await Promise.all(
    await glob('content/docs/**/*.mdx').then((files) =>
      files.map(readFromPath),
    ),
  );

  const docs = docsFiles.map(async (file) => {
    const relativePath = path.relative('content/docs', file.path);

    return {
      value: getSlugs(relativePath),
      hashes: await getHeadings(file.path, file.content),
    };
  });

  const scanned = await scanURLs({
    populate: {
      '(docs)/[[...slug]]': await Promise.all(docs),
    },
  });

  console.log(
    `collected ${scanned.urls.size} URLs, ${scanned.fallbackUrls.length} fallbacks`,
  );

  const getUrl = createGetUrl('/');
  printErrors(
    await validateFiles(docsFiles, {
      scanned,

      pathToUrl(value) {
        const relativePath = path.relative('content/docs', value);
        return getUrl(getSlugs(relativePath));
      },
      whitelist: (url) => url.startsWith('/api'),
    }),
    true,
  );
}

async function main() {
  await checkOpenApiDocs();
  await checkPublicDocsProviderIngressPolicy();
  await checkRestApiManualPages();
  await checkLinks();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
