/* @proprietary license */

import type { Metadata } from 'next';
import type { Language } from '@/lib/i18n/config';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

/** Header set by `proxy.ts` for `/en/...` aliases. */
export const DOCS_ROUTE_LOCALE_HEADER = 'x-lomi-docs-route-locale';

/** Unprefixed docs URLs are French and x-default. */
export const DOCS_DEFAULT_LOCALE = 'fr' as const;

export const DOCS_PREFIX_LOCALE = 'en' as const;

export type DocsRouteLocale = typeof DOCS_DEFAULT_LOCALE | typeof DOCS_PREFIX_LOCALE;

const MACHINE_EXACT_PATHS = new Set([
  '/llms.txt',
  '/llms-full.txt',
  '/sitemap.xml',
  '/robots.txt',
  '/openapi.json',
  '/agent-openapi.json',
]);

const MACHINE_PATH_PREFIXES = [
  '/api/',
  '/_next/',
  '/og/',
  '/llms.mdx/',
  '/static.json',
] as const;

export function normalizeDocsPath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.replace(/\/+$/, '') || '/';
}

export function isDocsMachinePath(pathname: string): boolean {
  if (MACHINE_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return MACHINE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function parseDocsLocalePath(pathname: string): {
  locale: DocsRouteLocale | null;
  pathname: string;
} {
  const normalized = normalizeDocsPath(pathname);
  const segments = normalized.split('/').filter(Boolean);

  if (segments[0] === DOCS_PREFIX_LOCALE) {
    const stripped = normalizeDocsPath(`/${segments.slice(1).join('/')}`);
    return { locale: DOCS_PREFIX_LOCALE, pathname: stripped };
  }

  return { locale: null, pathname: normalized };
}

export function localizeDocsPath(path: string, locale: Language): string {
  const normalized = normalizeDocsPath(path);
  if (locale === DOCS_DEFAULT_LOCALE) {
    return normalized;
  }
  if (normalized === '/') {
    return `/${DOCS_PREFIX_LOCALE}`;
  }
  return `/${DOCS_PREFIX_LOCALE}${normalized}`;
}

export function buildDocsAlternates(
  basePath: string,
  routeLocale: DocsRouteLocale = DOCS_DEFAULT_LOCALE,
): Metadata['alternates'] {
  const origin = getDocsSiteOrigin();
  const normalized = normalizeDocsPath(basePath);
  const frenchPath = normalized;
  const englishPath = localizeDocsPath(normalized, 'en');
  const canonicalPath =
    routeLocale === DOCS_PREFIX_LOCALE ? englishPath : frenchPath;

  return {
    canonical: `${origin}${canonicalPath}`,
    languages: {
      'x-default': `${origin}${frenchPath}`,
      fr: `${origin}${frenchPath}`,
      en: `${origin}${englishPath}`,
    },
  };
}
