/* @proprietary license */

import { defineI18n } from 'fumadocs-core/i18n';

/**
 * English is the source-file fallback. Public routing is French at unprefixed URLs
 * and English at `/en/...`; `proxy.ts` supplies the route locale to server components.
 */
export const fumadocsI18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'fr'],
  hideLocale: 'always',
  parser: 'dot',
  fallbackLanguage: 'en',
});
