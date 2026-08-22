/* @proprietary license */

import {
  getLocalStorageItem,
  isJsonObject,
  parseJson,
  readBoolean,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '@lomi./shared';

const ONBOARDING_STORAGE = 'lomi.docs.onboarding';
const ONBOARDING_DISMISSED_STORAGE = 'lomi.docs.onboardingDismissed';

const TEST_PAYMENT_PATHS = [
  '/start/first-payment',
  '/start/sandbox-payments',
] as const;

type DocsOnboardingProgress = {
  firstPayment?: boolean;
};

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isTestPaymentPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return TEST_PAYMENT_PATHS.some((candidate) => candidate === path);
}

function getDashboardBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  return url && url.length > 0
    ? url.replace(/\/$/, '')
    : 'https://dashboard.lomi.africa';
}

export function docsHandoffUrl(nextPath: string): string {
  return `${getDashboardBaseUrl()}/docs-handoff?next=${encodeURIComponent(nextPath)}`;
}

export function readOnboardingDismissed(): boolean {
  return getLocalStorageItem(ONBOARDING_DISMISSED_STORAGE) === '1';
}

export function writeOnboardingDismissed(dismissed: boolean): void {
  if (dismissed) {
    setLocalStorageItem(ONBOARDING_DISMISSED_STORAGE, '1');
    return;
  }
  removeLocalStorageItem(ONBOARDING_DISMISSED_STORAGE);
}

export function readOnboardingProgress(): DocsOnboardingProgress {
  const raw = getLocalStorageItem(ONBOARDING_STORAGE);
  if (!raw) return {};
  try {
    const parsed = parseJson(raw);
    if (!isJsonObject(parsed)) return {};
    const firstPayment = readBoolean(parsed, 'firstPayment');
    return firstPayment ? { firstPayment: true } : {};
  } catch {
    return {};
  }
}

export function writeOnboardingProgress(state: DocsOnboardingProgress): void {
  if (!state.firstPayment) {
    removeLocalStorageItem(ONBOARDING_STORAGE);
    return;
  }
  setLocalStorageItem(
    ONBOARDING_STORAGE,
    JSON.stringify({ firstPayment: true }),
  );
}

export function remainingOnboardingSteps(input: {
  signedIn: boolean;
  organizationCount: number;
  firstPayment: boolean;
}): number {
  const accountDone = input.signedIn;
  const keysDone = input.signedIn && input.organizationCount > 0;
  const paymentDone = input.signedIn && input.firstPayment;
  return [accountDone, keysDone, paymentDone].filter((done) => !done).length;
}

export function shouldShowOnboardingChecklist(input: {
  ready: boolean;
  dismissed: boolean;
  remainingSteps: number;
}): boolean {
  return input.ready && !input.dismissed && input.remainingSteps > 0;
}
