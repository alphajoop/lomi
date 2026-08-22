/* @proprietary license */

import type { Language } from '@/lib/i18n/config';
import { t as translate } from '@/lib/i18n/translations';
import type { McpTwin } from '@/lib/mcp-twins';
import { mcpTwinHref } from '@/lib/mcp-twins';

type DocsTwinLinkProps = {
  twin: McpTwin;
  locale: Language;
  direction?: 'mcp' | 'rest';
  restHref?: string;
};

export function DocsTwinLink({
  twin,
  locale,
  direction = 'mcp',
  restHref,
}: DocsTwinLinkProps) {
  const actionLabel = translate('twins.action', locale);
  const identifier = `${twin.tool} ${actionLabel}=${twin.action}`;

  if (direction === 'rest') {
    if (!restHref) return null;
    return (
      <p className="docs-twin-link">
        <span className="docs-twin-link-label">
          {translate('twins.rest', locale)}
        </span>
        <a className="docs-twin-link-target" href={restHref}>
          <code>{twin.operationKey}</code>
        </a>
      </p>
    );
  }

  return (
    <p className="docs-twin-link">
      <span className="docs-twin-link-label">
        {translate('twins.mcp', locale)}
      </span>
      <a
        className="docs-twin-link-target"
        href={mcpTwinHref(twin.tool, twin.action)}
      >
        <code>{identifier}</code>
      </a>
    </p>
  );
}
