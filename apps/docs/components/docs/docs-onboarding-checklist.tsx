/* @proprietary license */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  isJsonArray,
  isJsonObject,
  isString,
  readBoolean,
  validateJsonValue,
  type JsonValue,
} from '@lomi./shared';
import {
  docsHandoffUrl,
  isTestPaymentPath,
  readOnboardingDismissed,
  readOnboardingProgress,
  remainingOnboardingSteps,
  shouldShowOnboardingChecklist,
  writeOnboardingDismissed,
  writeOnboardingProgress,
} from '@/lib/docs-onboarding';
import { t as translate } from '@/lib/i18n/translations';
import { useTranslation } from '@/lib/utils/translation-context';

type TryItContext = {
  signedIn: boolean;
  organizations: { id: string; name: string }[];
};

type OnboardingStepId = 'account' | 'keys' | 'payment';

type OnboardingStep = {
  id: OnboardingStepId;
  done: boolean;
  label: string;
  href: string;
  external?: boolean;
};

function parseTryItContext(value: JsonValue): TryItContext {
  if (!isJsonObject(value)) {
    return { signedIn: false, organizations: [] };
  }
  const signedIn = readBoolean(value, 'signedIn') === true;
  const orgsValue = value.organizations;
  if (!isJsonArray(orgsValue)) {
    return { signedIn, organizations: [] };
  }
  const organizations: { id: string; name: string }[] = [];
  for (const org of orgsValue) {
    if (!isJsonObject(org)) continue;
    const id = org.id;
    const name = org.name;
    if (isString(id) && isString(name)) {
      organizations.push({ id, name });
    }
  }
  return { signedIn, organizations };
}

export function DocsOnboardingChecklist() {
  const pathname = usePathname();
  const { currentLanguage } = useTranslation();
  const t = (key: string) => translate(key, currentLanguage);

  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [firstPayment, setFirstPayment] = useState(false);
  const [ctx, setCtx] = useState<TryItContext | null>(null);

  useEffect(() => {
    setDismissed(readOnboardingDismissed());
    setFirstPayment(Boolean(readOnboardingProgress().firstPayment));
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const response = await fetch('/api/tryit-context', {
        credentials: 'include',
      });
      if (!response.ok || cancelled) return;
      try {
        const parsed = parseTryItContext(
          validateJsonValue(await response.json()),
        );
        if (!cancelled) setCtx(parsed);
      } catch {
        return;
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = Boolean(ctx?.signedIn);

  useEffect(() => {
    if (!signedIn || !pathname || !isTestPaymentPath(pathname)) return;
    setFirstPayment(true);
    writeOnboardingProgress({ firstPayment: true });
  }, [pathname, signedIn]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    writeOnboardingDismissed(true);
  }, []);

  if (!ready || dismissed) return null;

  const steps: OnboardingStep[] = [
    {
      id: 'account',
      done: signedIn,
      label: t('onboarding.account'),
      href: signedIn
        ? '/start/create-account'
        : docsHandoffUrl('/start/create-account'),
      external: !signedIn,
    },
    {
      id: 'keys',
      done: signedIn && (ctx?.organizations.length ?? 0) > 0,
      label: t('onboarding.keys'),
      href: '/start/api-keys',
    },
    {
      id: 'payment',
      done: signedIn && firstPayment,
      label: t('onboarding.payment'),
      href: '/start/first-payment',
    },
  ];

  const remaining = remainingOnboardingSteps({
    signedIn,
    organizationCount: ctx?.organizations.length ?? 0,
    firstPayment,
  });
  if (
    !shouldShowOnboardingChecklist({
      ready,
      dismissed,
      remainingSteps: remaining,
    })
  ) {
    return null;
  }

  return (
    <div className="docs-onboarding-checklist rounded-[14px] border border-fd-border bg-fd-card/60 p-3 text-[12px]">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 font-medium text-fd-foreground">
          {t('onboarding.title')}
        </p>
        <button
          type="button"
          className="shrink-0 text-fd-muted-foreground underline-offset-2 hover:underline"
          onClick={dismiss}
        >
          {t('onboarding.dismiss')}
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-center gap-2 text-fd-muted-foreground"
          >
            <span
              aria-hidden
              className={
                step.done ? 'text-fd-foreground' : 'text-fd-muted-foreground'
              }
            >
              {step.done ? '✓' : '○'}
            </span>
            {step.done ? (
              <span className="text-fd-muted-foreground line-through">
                {step.label}
              </span>
            ) : step.external ? (
              <a
                href={step.href}
                className="underline-offset-2 hover:underline"
              >
                {step.label}
              </a>
            ) : (
              <Link
                href={step.href}
                className="underline-offset-2 hover:underline"
              >
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
