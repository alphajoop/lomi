/* @proprietary license */

import type { MetadataRoute } from 'next';
import { getDocsSiteOrigin } from '@/lib/utils/metadata';

export default function robots(): MetadataRoute.Robots {
  const origin = getDocsSiteOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
