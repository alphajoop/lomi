/* @proprietary license */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

type TryItContext = {
  signedIn: boolean;
  useTestKey: boolean;
  organizations: { id: string; name: string }[];
  selectedOrganizationId: string | null;
  needsOrganizationChoice: boolean;
};

export function TryItOpenApiPanel() {
  const pathname = usePathname();
  const [ctx, setCtx] = useState<TryItContext | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/tryit-context', { credentials: 'include' });
    if (r.ok) {
      setCtx(await r.json());
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!pathname?.includes('/openapi/')) {
    return null;
  }

  if (!ctx) {
    return (
      <div
        className={cn(
          'mb-4 rounded-md border border-fd-border bg-fd-card px-3 py-2 text-sm text-fd-muted-foreground',
        )}
      >
        Loading Try-it preferences…
      </div>
    );
  }

  if (!ctx.signedIn) {
    return null;
  }

  const hasTestKeys = ctx.organizations.length > 0;
  const injectSwitchDisabled =
    pending ||
    !hasTestKeys ||
    (ctx.organizations.length > 1 && !ctx.selectedOrganizationId);

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
          No active test secret key found for your account. Create one in the
          dashboard Developers section, then refresh this page.
        </p>
      )}

      {hasTestKeys && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {ctx.organizations.length > 1 && (
            <div className="flex flex-col gap-1.5 sm:min-w-[220px]">
              <Label htmlFor="tryit-org">Organization</Label>
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
                    ? 'Select organization…'
                    : 'Choose…'}
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
              Attach my test secret key automatically
            </Label>
          </div>
        </div>
      )}

      {ctx.useTestKey &&
        !injectSwitchDisabled &&
        ctx.selectedOrganizationId && (
          <p className="mt-2 text-xs text-fd-muted-foreground">
            When the playground does not send{' '}
            <code className="rounded bg-fd-muted px-1">X-API-Key</code>, the
            proxy adds your test secret for this organization. You can still
            override by entering a key manually.
          </p>
        )}
    </div>
  );
}
