/* @proprietary license */

import type { MetadataRoute } from 'next';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';
import { ROBOTS_ALLOW, ROBOTS_DISALLOW } from '@/lib/seo/robots-policy';

export default function robots(): MetadataRoute.Robots {
  const origin = getDocsSiteOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: [...ROBOTS_ALLOW],
      disallow: [...ROBOTS_DISALLOW],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
