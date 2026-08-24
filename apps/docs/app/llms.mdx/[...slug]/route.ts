/* @proprietary license */

import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/lib/utils/get-llm-text';
import { source } from '@/lib/utils/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug, 'en');
  if (!page) notFound();

  return new NextResponse(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

export function generateStaticParams() {
  return source
    .getPages('en')
    .map((page) => ({ slug: page.slugs }))
    .filter((page) => (page.slug?.length ?? 0) > 0);
}
