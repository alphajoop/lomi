/* @proprietary license */

import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/lib/utils/get-llm-text';
import { source } from '@/lib/utils/source';
import { getDocsLocale } from '@/lib/utils/docs-locale';
import {
  DISCOVERY_MARKDOWN_HEADERS,
  buildDocsNotFoundMarkdown,
} from '@/lib/seo/agent-discovery';
import type { Language } from '@/lib/i18n/config';

export const revalidate = false;

function fallbackLocale(locale: Language): Language {
  return locale === 'fr' ? 'en' : 'fr';
}

function markdownHeaders(cacheControl?: string): Headers {
  const headers = new Headers({
    ...DISCOVERY_MARKDOWN_HEADERS,
    Vary: 'Accept, User-Agent',
  });
  if (cacheControl) {
    headers.set('Cache-Control', cacheControl);
  }
  return headers;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const locale = await getDocsLocale();
  const page =
    source.getPage(slug, locale) ??
    source.getPage(slug, fallbackLocale(locale));
  if (!page) {
    return new NextResponse(buildDocsNotFoundMarkdown(), {
      status: 404,
      headers: markdownHeaders('public, max-age=0, must-revalidate'),
    });
  }

  return new NextResponse(await getLLMText(page), {
    headers: markdownHeaders(),
  });
}

export function generateStaticParams() {
  const slugs = new Map<string, string[]>();
  for (const language of ['en', 'fr'] as const) {
    for (const page of source.getPages(language)) {
      if ((page.slugs?.length ?? 0) === 0) continue;
      slugs.set(page.slugs.join('/'), page.slugs);
    }
  }
  return [...slugs.values()].map((slug) => ({ slug }));
}
