/* @proprietary license */

import { source } from '@/lib/utils/source';
import { notFound } from 'next/navigation';
import { generateOGImage } from '@/lib/og/mono';
import type { Language } from '@/lib/i18n/config';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const [localeSegment, ...localizedSlug] = slug;
  const locale: Language = localeSegment === 'fr' ? 'fr' : 'en';
  const page = source.getPage(localizedSlug.slice(0, -1), locale);
  if (!page) notFound();

  return generateOGImage({
    title: page.data.title,
    description: page.data.description,
  });
}

export function generateStaticParams(): {
  slug: string[];
}[] {
  return (['fr', 'en'] as const).flatMap((locale) =>
    source.getPages(locale).map((page) => ({
      slug: [locale, ...page.slugs, 'image.png'],
    })),
  );
}
