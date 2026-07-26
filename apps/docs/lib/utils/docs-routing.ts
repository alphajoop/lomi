/* @proprietary license */

import type { Metadata } from 'next';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

/** Legacy locale prefixes redirected away by `proxy.ts`. */
export const DOCS_LEGACY_PREFIX_LOCALES = ['en', 'fr'] as const;

export type DocsLegacyPrefixLocale =
  (typeof DOCS_LEGACY_PREFIX_LOCALES)[number];

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
  locale: DocsLegacyPrefixLocale | null;
  pathname: string;
} {
  const normalized = normalizeDocsPath(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const first = segments[0];

  if (
    first &&
    (DOCS_LEGACY_PREFIX_LOCALES as readonly string[]).includes(first)
  ) {
    const stripped = normalizeDocsPath(`/${segments.slice(1).join('/')}`);
    return { locale: first as DocsLegacyPrefixLocale, pathname: stripped };
  }

  return { locale: null, pathname: normalized };
}

/** Paths are never locale-prefixed; language is cookie-only. */
export function localizeDocsPath(path: string): string {
  return normalizeDocsPath(path);
}

export function buildDocsAlternates(
  basePath: string,
): Metadata['alternates'] {
  const origin = getDocsSiteOrigin();
  const normalized = normalizeDocsPath(basePath);
  const url = `${origin}${normalized}`;

  return {
    canonical: url,
    languages: {
      'x-default': url,
      fr: url,
      en: url,
    },
  };
}
