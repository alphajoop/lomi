import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, '..', '..');
process.env.NEXT_PUBLIC_SITE_URL = 'https://docs.lomi.africa';
const { buildDocsAlternates } = await import('../utils/docs-routing.ts');

function read(relativePath) {
  return readFileSync(join(docsRoot, relativePath), 'utf8');
}

test('docs pages use unprefixed self-canonical URLs for all languages', () => {
  const alternates = buildDocsAlternates('/start/overview');

  assert.equal(alternates.canonical, 'https://docs.lomi.africa/start/overview');
  assert.deepEqual(alternates.languages, {
    'x-default': 'https://docs.lomi.africa/start/overview',
    fr: 'https://docs.lomi.africa/start/overview',
    en: 'https://docs.lomi.africa/start/overview',
  });
});

test('dynamic sitemap is the only docs sitemap source', () => {
  assert.equal(existsSync(join(docsRoot, 'public/sitemap.xml')), false);
  assert.doesNotMatch(read('lib/scripts/post-build.ts'), /generateSitemap/);
  assert.match(read('app/sitemap.ts'), /buildDocsAlternates/);
  assert.doesNotMatch(read('app/sitemap.ts'), /localizeDocsPath/);
});

test('docs locale is resolved from the language cookie, not the URL', () => {
  const localeSource = read('lib/utils/docs-locale.ts');
  const proxySource = read('proxy.ts');
  const routingSource = read('lib/utils/docs-routing.ts');

  assert.match(localeSource, /\bcookies\b/);
  assert.match(localeSource, /lomi\.language|Cookies\.Language/);
  assert.match(proxySource, /301/);
  assert.match(routingSource, /Paths are never locale-prefixed/);
});

test('legacy content redirects stay unprefixed', () => {
  const configSource = read('next.config.mjs');

  assert.match(configSource, /core\/introduction\/what-is-lomi/);
  assert.match(configSource, /source:\s*'\/build\/lomi-ui\/quick-start'/);
  assert.match(configSource, /destination:\s*'\/build\/lomi-ui'/);
  assert.doesNotMatch(configSource, /source:\s*'\/en\//);
});

test('page metadata emits locale-aware Open Graph and structured data', () => {
  const pageSource = read('app/(docs)/[[...slug]]/page.tsx');
  const docsLayoutSource = read('app/(docs)/layout.tsx');
  const ogSource = read('app/og/[...slug]/route.tsx');
  const layoutSource = read('app/layout.tsx');
  const notFoundSource = read('app/not-found.tsx');

  assert.match(pageSource, /locale:\s*locale === 'fr' \? 'fr_FR' : 'en_US'/);
  assert.match(pageSource, /application\/ld\+json/);
  assert.doesNotMatch(ogSource, /getPage\(slug\.slice\(0, -1\), 'en'\)/);
  assert.doesNotMatch(layoutSource, /buildDocsAlternates/);
  assert.match(notFoundSource, /index:\s*false/);
  assert.doesNotMatch(docsLayoutSource, /localizeDocsPath/);
  assert.doesNotMatch(pageSource, /localizeDocsPath/);
});
