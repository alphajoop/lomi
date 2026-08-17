/* @proprietary license */

import { source } from '@/lib/utils/source';
import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb';
import { isString, isJsonObject } from '@lomi./shared';

export const revalidate = false;

// Orama Cloud-compatible document format
// Orama Cloud requires flat arrays of primitives, not nested objects
interface OramaCloudDocument {
  id: string;
  page_id: string;
  title: string;
  description?: string;
  url: string;
  tag?: string;
  structured: {
    headings: string[];
    contents: string[];
  };
  breadcrumbs: string[];
}

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

export async function GET(): Promise<Response> {
  const results: OramaCloudDocument[] = [];
  const pages = source.getPages('en');
  for (const page of pages) {
    if (page.slugs[0] === 'openapi') continue;

    const items = getBreadcrumbItems(page.url, source.getPageTree('en'), {
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
      : { headings: [], contents: [] };

    results.push({
      id: page.url,
      page_id: page.url,
      title: page.data.title ?? 'Untitled',
      description: page.data.description,
      url: page.url,
      tag: page.slugs[0],
      structured,
      breadcrumbs: items.flatMap<string>((item, i) =>
        i > 0 && isString(item.name) ? item.name : [],
      ),
    });
  }

  return Response.json(results);
}
