/* @proprietary license */

import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb';
import { isJsonObject, isString } from '@lomi./shared';
import { source } from '@/lib/utils/source';
import { aliasesForPath } from '@/lib/search/aliases';
import { searchTagFromSection } from '@/lib/search/tags';
import type { Language } from '@/lib/i18n/config';

export type DocsSearchDocument = {
  id: string;
  page_id: string;
  title: string;
  description?: string;
  url: string;
  tag?: string;
  locale: Language;
  aliases: string[];
  structured: {
    headings: string[];
    contents: string[];
  };
  breadcrumbs: string[];
};

function toHeadingStrings(headings: unknown): string[] {
  if (!Array.isArray(headings)) return [];
  return headings
    .map((h) => (isJsonObject(h) && h.id ? String(h.id) : String(h)))
    .filter((h) => h.length > 0);
}

function toContentStrings(contents: unknown): string[] {
  if (!Array.isArray(contents)) return [];
  return contents
    .map((c) => {
      if (isJsonObject(c)) {
        const content = c.content;
        return isString(content)
          ? content.trim()
          : String(content ?? '').trim();
      }
      return String(c).trim();
    })
    .filter((c) => c.length > 0);
}

const LOCALES: readonly Language[] = ['en', 'fr'];

/** Orama Cloud + local-search documents for every English and French page. */
export function buildDocsSearchDocuments(): DocsSearchDocument[] {
  const results: DocsSearchDocument[] = [];

  for (const locale of LOCALES) {
    const pages = source.getPages(locale);
    const tree = source.getPageTree(locale);

    for (const page of pages) {
      if (page.slugs[0] === 'openapi') continue;

      const items = getBreadcrumbItems(page.url, tree, {
        includePage: false,
        includeRoot: true,
      });

      const structuredData =
        'structuredData' in page.data && isJsonObject(page.data.structuredData)
          ? page.data.structuredData
          : undefined;
      const structured = structuredData
        ? {
            headings: toHeadingStrings(structuredData.headings),
            contents: toContentStrings(structuredData.contents),
          }
        : { headings: [] as string[], contents: [] as string[] };

      const url = page.url.startsWith('/') ? page.url : `/${page.url}`;
      const aliases = [...aliasesForPath(url)];
      if (aliases.length) {
        structured.contents = [...structured.contents, ...aliases];
      }

      results.push({
        id: `${locale}:${url}`,
        page_id: url,
        title: page.data.title ?? 'Untitled',
        description: page.data.description,
        url,
        tag: searchTagFromSection(page.slugs[0]),
        locale,
        aliases,
        structured,
        breadcrumbs: items.flatMap<string>((item, i) =>
          i > 0 && isString(item.name) ? item.name : [],
        ),
      });
    }
  }

  return results;
}
