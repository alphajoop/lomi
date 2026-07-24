/* @proprietary license */

import type { MetadataRoute } from 'next';
import { source } from '@/lib/utils/source';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';
import {
  buildDocsAlternates,
  localizeDocsPath,
} from '@/lib/utils/docs-routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getDocsSiteOrigin();
  const pages = source.getPages('en');

  return pages.flatMap((page) => {
    const path = page.url.startsWith('/') ? page.url : `/${page.url}`;
    const alternates = buildDocsAlternates(path);
    const languages = (alternates?.languages ?? {}) as Record<string, string>;
    const changeFrequency = path.startsWith('/api/') ? 'weekly' : 'monthly';
    const priority =
      path === '/start/overview' ? 1 : path.startsWith('/start/') ? 0.9 : 0.7;

    return [path, localizeDocsPath(path, 'en')].map((localizedPath) => ({
      url: `${origin}${localizedPath}`,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
