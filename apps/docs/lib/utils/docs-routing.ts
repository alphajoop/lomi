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
  '/llms.mdx',
  '/sitemap.xml',
  '/robots.txt',
  '/openapi.json',
  '/agent-openapi.json',
  '/agents',
  '/agents.md',
]);

const MACHINE_PATH_PREFIXES = [
  '/api/',
  '/_next/',
  '/og/',
  '/llms.mdx/',
  '/static.json',
  '/agents/',
  '/.well-known/',
] as const;

export function normalizeDocsPath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.replace(/\/+$/, '') || '/';
}

/** Canonical markdown endpoint for page Copy / Open-in-LLM actions. */
export function buildDocsMarkdownUrl(pageUrl: string): string {
  const path = normalizeDocsPath(pageUrl);
  return path === '/' ? '/llms.mdx' : `/llms.mdx${path}`;
}

export function isDocsMachinePath(pathname: string): boolean {
  if (MACHINE_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return MACHINE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function docsMarkdownAcceptRewritePath(pathname: string): string | null {
  const path = normalizeDocsPath(pathname);
  if (path.endsWith('.mdx') || path.startsWith('/llms.mdx')) {
    return null;
  }
  if (isDocsMachinePath(path)) {
    return null;
  }
  if (path === '/') {
    return '/start/overview.mdx';
  }
  return `${path}.mdx`;
}

type ParsedDocsLocalePath = {
  locale: DocsLegacyPrefixLocale | null;
  pathname: string;
};

export function parseDocsLocalePath(pathname: string): ParsedDocsLocalePath {
  const normalized = normalizeDocsPath(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const first = segments[0];

  if (
    first &&
    // SAFETY: Boundary value matches the asserted domain type at this call site.
    (DOCS_LEGACY_PREFIX_LOCALES as readonly string[]).includes(first)
  ) {
    const stripped = normalizeDocsPath(`/${segments.slice(1).join('/')}`);
    // SAFETY: Boundary value matches the asserted domain type at this call site.
    return { locale: first as DocsLegacyPrefixLocale, pathname: stripped };
  }

  return { locale: null, pathname: normalized };
}

/** Paths are never locale-prefixed; language is cookie-only. */
export function localizeDocsPath(path: string): string {
  return normalizeDocsPath(path);
}

export function buildDocsAlternates(basePath: string): Metadata['alternates'] {
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
