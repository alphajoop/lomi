/* @proprietary license */

import { source } from '@/lib/utils/source';
import { createFromSource } from 'fumadocs-core/search/server';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import { searchTagFromSection } from '@/lib/search/tags';

function isStructuredData(value: unknown): value is StructuredData {
  if (!value || typeof value !== 'object') return false;
  return 'headings' in value && 'contents' in value;
}

export const { GET } = createFromSource(source, {
  localeMap: {
    en: 'english',
    fr: 'french',
  },
  async buildIndex(page) {
    const data = page.data as {
      title?: string;
      description?: string;
      structuredData?: StructuredData | (() => Promise<StructuredData>);
      load?: () => Promise<{ structuredData?: StructuredData }>;
    };

    let structuredData: StructuredData | undefined;
    if (typeof data.structuredData === 'function') {
      structuredData = await data.structuredData();
    } else if (isStructuredData(data.structuredData)) {
      structuredData = data.structuredData;
    } else if (typeof data.load === 'function') {
      const loaded = await data.load();
      structuredData = loaded.structuredData;
    }

    if (!structuredData) {
      throw new Error(
        `Cannot find structured data from page ${page.url}, please define the page to index function.`,
      );
    }

    return {
      title: data.title ?? page.url,
      description: data.description,
      url: page.url,
      id: page.url,
      structuredData,
      tag: searchTagFromSection(page.slugs[0]),
    };
  },
});
