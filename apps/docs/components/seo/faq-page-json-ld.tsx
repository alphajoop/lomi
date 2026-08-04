/* @proprietary license */

import type { BrandFaqItem } from '@/lib/seo/brand-facts';

type FaqPageJsonLdProps = {
  items: readonly BrandFaqItem[];
};

export function FaqPageJsonLd({ items }: FaqPageJsonLdProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
