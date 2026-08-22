/* @proprietary license */

import { TryItOpenApiPanel } from '@/components/docs/try-it-openapi-panel';
import { DocsApiPlayground } from '@/lib/openapi/playground';
import { t as translate } from '@/lib/i18n/translations';
import type { Language } from '@/lib/i18n/config';

type DocsApiTryItProps = {
  method: string;
  path: string;
  locale: Language;
};

export function DocsApiTryIt({ method, path, locale }: DocsApiTryItProps) {
  return (
    <details className="docs-api-tryit not-prose">
      <summary className="docs-api-tryit-summary">
        {translate('tryit.summary', locale)}
      </summary>
      <div className="docs-api-tryit-body">
        <TryItOpenApiPanel enabled />
        <DocsApiPlayground method={method} path={path} />
      </div>
    </details>
  );
}
