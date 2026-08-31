/* @proprietary license */

'use client';

import { Fragment, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  ClaudeBrandIcon,
  CodexBrandIcon,
  CursorBrandIcon,
  GrokBrandIcon,
  OpenCodeBrandIcon,
} from '@/components/docs/ai-brand-icons';
import {
  CLAUDE_CONNECTORS_URL,
  GROK_BOT_URL,
  MCP_OAUTH_ENDPOINT,
  buildCodexOauthCommand,
  buildCursorOauthDeeplink,
  buildOpenCodeOauthCommand,
  type McpOauthClientId,
} from '@/lib/mcp/oauth-connect';
import { translate } from '@/lib/i18n/translations';
import { useTranslation } from '@/lib/utils/translation-context';
import { cn } from '@lomi./ui/cn';

const buttonClass =
  'inline-flex h-9 touch-manipulation select-none items-center gap-2 rounded-md border border-fd-border bg-fd-background px-3.5 text-[13px] font-medium text-fd-foreground transition-colors hover:bg-fd-muted';

const CLIENT_ORDER: McpOauthClientId[] = [
  'cursor',
  'claude',
  'opencode',
  'codex',
];

const LABEL_KEY: Record<McpOauthClientId, string> = {
  cursor: 'mcpConnect.addCursor',
  claude: 'mcpConnect.addClaude',
  opencode: 'mcpConnect.addOpenCode',
  codex: 'mcpConnect.addCodex',
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function McpOauthConnect({ className }: { className?: string }) {
  const { currentLanguage } = useTranslation();
  const t = useCallback(
    (key: string) => translate(key, currentLanguage),
    [currentLanguage],
  );

  const onCopy = useCallback(
    async (value: string, successKey: string) => {
      const ok = await copyText(value);
      if (ok) {
        toast.success(t(successKey));
      } else {
        toast.error(t('mcpConnect.copyFailed'));
      }
    },
    [t],
  );

  const onClaude = useCallback(() => {
    void onCopy(MCP_OAUTH_ENDPOINT, 'mcpConnect.urlCopied');
    window.open(CLAUDE_CONNECTORS_URL, '_blank', 'noopener,noreferrer');
  }, [onCopy]);

  const clientUi: Record<
    McpOauthClientId,
    { icon: ReactNode; onClick: () => void }
  > = {
    cursor: {
      icon: <CursorBrandIcon className="size-4 shrink-0" />,
      onClick: () => {
        window.location.href = buildCursorOauthDeeplink();
      },
    },
    claude: {
      icon: <ClaudeBrandIcon className="size-4 shrink-0" />,
      onClick: onClaude,
    },
    opencode: {
      icon: <OpenCodeBrandIcon className="size-4 shrink-0" />,
      onClick: () => {
        void onCopy(buildOpenCodeOauthCommand(), 'mcpConnect.commandCopied');
      },
    },
    codex: {
      icon: <CodexBrandIcon className="size-4 shrink-0" />,
      onClick: () => {
        void onCopy(buildCodexOauthCommand(), 'mcpConnect.commandCopied');
      },
    },
  };

  return (
    <div className={cn('not-prose my-4 flex flex-wrap gap-2', className)}>
      {CLIENT_ORDER.map((client) => {
        const ui = clientUi[client];
        return (
          <Fragment key={client}>
            {client === 'cursor' ? (
              <a className={buttonClass} href={buildCursorOauthDeeplink()}>
                {ui.icon}
                {t(LABEL_KEY[client])}
              </a>
            ) : (
              <button
                type="button"
                className={buttonClass}
                onClick={ui.onClick}
              >
                {ui.icon}
                {t(LABEL_KEY[client])}
              </button>
            )}
            {client === 'cursor' ? (
              <a
                className={buttonClass}
                href={GROK_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GrokBrandIcon className="size-4 shrink-0" />
                {t('mcpConnect.addGrok')}
              </a>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
