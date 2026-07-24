/* @proprietary license */

import { NotFoundPage } from '@/components/not-found-page';
import { getDocsLocale } from '@/lib/utils/docs-locale';
import { translate } from '@/lib/i18n/translations';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotFound() {
  const locale = await getDocsLocale();
  const label = translate('ui.notFound', locale);

  return <NotFoundPage label={label} />;
}
