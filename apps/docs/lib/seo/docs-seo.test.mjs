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

test('English docs pages use self-canonical URLs with reciprocal hreflang', () => {
  const alternates = buildDocsAlternates('/start/overview', 'en');

  assert.equal(
    alternates.canonical,
    'https://docs.lomi.africa/en/start/overview',
  );
  assert.deepEqual(alternates.languages, {
    'x-default': 'https://docs.lomi.africa/start/overview',
    fr: 'https://docs.lomi.africa/start/overview',
    en: 'https://docs.lomi.africa/en/start/overview',
  });
});

test('dynamic sitemap is the only docs sitemap source', () => {
  assert.equal(existsSync(join(docsRoot, 'public/sitemap.xml')), false);
  assert.doesNotMatch(read('lib/scripts/post-build.ts'), /generateSitemap/);
  assert.match(read('app/sitemap.ts'), /localizeDocsPath/);
});

test('unprefixed docs content cannot be changed by a language cookie', () => {
  const localeSource = read('lib/utils/docs-locale.ts');

  assert.doesNotMatch(localeSource, /\bcookies\b/);
  assert.doesNotMatch(localeSource, /lomi\.language/);
});

test('legacy redirects include the indexed overview URL and English mirrors', () => {
  const configSource = read('next.config.mjs');

  assert.match(configSource, /core\/introduction\/what-is-lomi/);
  assert.match(configSource, /source:\s*'\/en\/build\/lomi-ui\/quick-start'/);
  assert.match(configSource, /destination:\s*'\/en\/build\/lomi-ui'/);
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
  assert.match(docsLayoutSource, /localizeDocsPath/);
});
