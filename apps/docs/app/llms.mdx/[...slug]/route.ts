/* @proprietary license */

import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/lib/utils/get-llm-text';
import { source } from '@/lib/utils/source';
import { getDocsLocale } from '@/lib/utils/docs-locale';
import { notFound } from 'next/navigation';
import type { Language } from '@/lib/i18n/config';

export const revalidate = false;

function fallbackLocale(locale: Language): Language {
  return locale === 'fr' ? 'en' : 'fr';
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
  if (!page) notFound();

  return new NextResponse(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
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
