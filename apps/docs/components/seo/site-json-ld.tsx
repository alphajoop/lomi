/* @proprietary license */

import { getDocsSiteOrigin } from '@/lib/utils/metadata';
import {
  BRAND_CATEGORY,
  BRAND_DEFINITION,
  BRAND_NAME,
  MARKETING_ORIGIN,
} from '@/lib/seo/brand-facts';

export function SiteJsonLd() {
  const docsOrigin = getDocsSiteOrigin();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${MARKETING_ORIGIN}/#organization`,
        name: BRAND_NAME,
        url: MARKETING_ORIGIN,
        description: BRAND_DEFINITION,
      },
      {
        '@type': 'WebSite',
        '@id': `${docsOrigin}/#website`,
        url: docsOrigin,
        name: `${BRAND_NAME} docs`,
        description: BRAND_CATEGORY,
        publisher: { '@id': `${MARKETING_ORIGIN}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
