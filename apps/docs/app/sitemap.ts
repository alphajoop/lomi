/* @proprietary license */

import type { MetadataRoute } from 'next';
import { AGENT_CORPUS_ROUTES } from '@/lib/docs/agent-corpus/slugs';
import { source } from '@/lib/utils/source';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';
import { buildDocsAlternates } from '@/lib/utils/docs-routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getDocsSiteOrigin();
  const pages = source.getPages('en');
  const lastModified = new Date();

  const docEntries = pages.map((page) => {
    const path = page.url.startsWith('/') ? page.url : `/${page.url}`;
    const alternates = buildDocsAlternates(path);
    // SAFETY: Boundary value matches the asserted domain type at this call site.
    const languages = (alternates?.languages ?? {}) as Record<string, string>;
    // SAFETY: Boundary value matches the asserted domain type at this call site.
    const changeFrequency = (
      path.startsWith('/api/') ? 'weekly' : 'monthly'
    ) as 'weekly' | 'monthly';
    const priority =
      path === '/' ? 1 : path.startsWith('/start/') ? 0.9 : 0.7;

    return {
      url: `${origin}${path}`,
      changeFrequency,
      priority,
      lastModified,
      alternates: { languages },
    };
  });

  const agentEntries: MetadataRoute.Sitemap = AGENT_CORPUS_ROUTES.map(
    (path) => ({
      url: `${origin}${path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '/agents' ? 0.75 : 0.7,
      lastModified,
    }),
  );

  return [...agentEntries, ...docEntries];
}
