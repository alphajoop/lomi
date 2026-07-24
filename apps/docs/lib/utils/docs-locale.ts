/* @proprietary license */

import { cache } from 'react';
import { headers } from 'next/headers';
import type { Language } from '@/lib/i18n/config';
import {
  DOCS_DEFAULT_LOCALE,
  DOCS_ROUTE_LOCALE_HEADER,
} from '@/lib/utils/docs-routing';

/**
 * Locale from `/en/...` aliases set by `proxy.ts`. Unprefixed routes resolve to French.
 */
export const detectDocsRouteLocale = cache(async (): Promise<Language> => {
  const headerList = await headers();
  const fromRoute = headerList.get(DOCS_ROUTE_LOCALE_HEADER);
  if (fromRoute === 'en') {
    return 'en';
  }
  return DOCS_DEFAULT_LOCALE;
});

/** Resolves docs content solely from the crawlable URL locale. */
export async function getDocsLocale(): Promise<Language> {
  return detectDocsRouteLocale();
}
