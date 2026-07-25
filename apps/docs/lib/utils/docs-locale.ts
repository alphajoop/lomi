/* @proprietary license */

import { cookies } from 'next/headers';
import type { Language } from '@/lib/i18n/config';
import { Cookies } from '@/lib/utils/constants';

const VALID_LOCALES = new Set<Language>(['en', 'fr']);

/**
 * Resolves the active docs content locale from the same cookie as `TranslationProvider`
 * (`lomi.language`). No URL segment is used.
 */
export async function getDocsLocale(): Promise<Language> {
  const store = await cookies();
  const raw = store.get(Cookies.Language)?.value;
  if (raw && VALID_LOCALES.has(raw as Language)) {
    return raw as Language;
  }
  return 'fr';
}
