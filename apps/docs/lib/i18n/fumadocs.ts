/* @proprietary license */

import { defineI18n } from 'fumadocs-core/i18n';

/**
 * English + French. `hideLocale: 'always'` keeps public URLs free of a locale
 * segment; locale is selected via the `lomi.language` cookie in server components.
 */
export const fumadocsI18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'fr'],
  hideLocale: 'always',
  parser: 'dot',
  fallbackLanguage: 'en',
});
