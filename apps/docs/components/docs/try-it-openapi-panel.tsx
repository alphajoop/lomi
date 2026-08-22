/* @proprietary license */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Checkbox } from '@lomi./ui/checkbox';
import { Label } from '@lomi./ui/label';
import { cn } from '@lomi./ui/cn';
import { canAttachTestKey, isDocsApiOperationPath } from '@/lib/tryit/gating';
import { t as translate } from '@/lib/i18n/translations';
import { useTranslation } from '@/lib/utils/translation-context';

type TryItContext = {
  signedIn: boolean;
  useTestKey: boolean;
  organizations: { id: string; name: string }[];
  selectedOrganizationId: string | null;
  needsOrganizationChoice: boolean;
};

type TryItOpenApiPanelProps = {
  enabled?: boolean;
};

export function TryItOpenApiPanel({ enabled }: TryItOpenApiPanelProps) {
  const pathname = usePathname();
  const { currentLanguage } = useTranslation();
  const t = (key: string) => translate(key, currentLanguage);
  const [ctx, setCtx] = useState<TryItContext | null>(null);
  const [pending, setPending] = useState(false);
  const visible = enabled ?? isDocsApiOperationPath(pathname ?? '');

  const load = useCallback(async () => {
    const r = await fetch('/api/tryit-context', { credentials: 'include' });
    if (r.ok) {
      setCtx(await r.json());
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    void load();
  }, [load, visible]);

  if (!visible) {
    return null;
  }

  if (!ctx) {
    return (
      <div
        className={cn(
          'mb-4 rounded-md border border-fd-border bg-fd-card px-3 py-2 text-sm text-fd-muted-foreground',
        )}
      >
        {t('tryit.loading')}
      </div>
    );
  }

  if (!ctx.signedIn) {
    const dashboard =
      process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://dashboard.lomi.africa';
    const next = pathname || '/api';
    return (
      <div
        className={cn(
          'mb-4 rounded-md border border-fd-border bg-fd-card px-3 py-2 text-sm text-fd-muted-foreground',
        )}
      >
        <a
          className="underline underline-offset-2"
          href={`${dashboard.replace(/\/$/, '')}/docs-handoff?next=${encodeURIComponent(next)}`}
        >
          {t('tryit.connect')}
        </a>{' '}
        {t('tryit.connectHint')}
      </div>
    );
  }

  const hasTestKeys = ctx.organizations.length > 0;
  const injectSwitchDisabled =
    pending ||
    !canAttachTestKey({
      signedIn: ctx.signedIn,
      organizations: ctx.organizations,
      selectedOrganizationId: ctx.selectedOrganizationId,
    });

  const savePrefs = async (
    useTestKey: boolean,
    organizationId: string | null,
  ) => {
    setPending(true);
    try {
      const res = await fetch('/api/tryit-prefs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useTestKey, organizationId }),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setPending(false);
    }
  };

  const onSwitchChange = (checked: boolean) => {
    const orgId =
      ctx.selectedOrganizationId ??
      (ctx.organizations.length === 1 ? ctx.organizations[0]!.id : null);
    if (checked && !orgId) {
      return;
    }
    void savePrefs(checked, orgId);
  };

  const onOrgChange = (orgId: string) => {
    void savePrefs(ctx.useTestKey, orgId || null);
  };

  return (
    <div
      className={cn(
        'mb-6 rounded-lg border border-fd-border bg-fd-card px-4 py-3 text-sm shadow-sm',
      )}
    >
      {!hasTestKeys && (
        <p className="mt-2 text-amber-700 dark:text-amber-400">
          {t('tryit.noTestKey')}
        </p>
      )}

      {hasTestKeys && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {ctx.organizations.length > 1 && (
            <div className="flex flex-col gap-1.5 sm:min-w-[220px]">
              <Label htmlFor="tryit-org">{t('tryit.organization')}</Label>
              <select
                id="tryit-org"
                className={cn(
                  'rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-fd-foreground',
                )}
                value={ctx.selectedOrganizationId ?? ''}
                onChange={(e) => onOrgChange(e.target.value)}
                disabled={pending}
              >
                <option value="">
                  {ctx.needsOrganizationChoice
                    ? t('tryit.selectOrganization')
                    : t('tryit.chooseOrganization')}
                </option>
                {ctx.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="tryit-inject"
              checked={ctx.useTestKey}
              onCheckedChange={(checked: boolean | 'indeterminate') =>
                onSwitchChange(checked === true)
              }
              disabled={injectSwitchDisabled}
            />
            <Label htmlFor="tryit-inject" className="cursor-pointer">
              {t('tryit.attachKey')}
            </Label>
          </div>
        </div>
      )}

      {ctx.useTestKey &&
        !injectSwitchDisabled &&
        ctx.selectedOrganizationId && (
          <p className="mt-2 text-xs text-fd-muted-foreground">
            {t('tryit.proxyHint')}
          </p>
        )}
    </div>
  );
}
