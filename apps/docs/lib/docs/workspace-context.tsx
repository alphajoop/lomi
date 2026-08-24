'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  personalizeSnippet as applyPersonalize,
  resolveTestApiKeyDisplay,
  type ApiKeyResolution,
} from '@/lib/docs/personalize';
import {
  readStoredOrgId,
  writeStoredOrgId,
} from '@/lib/docs/workspace-storage';

export type DocsWorkspaceOrg = { id: string; name: string };

export type DocsPricingPlan = 'fixed' | 'dynamic' | 'custom' | null;
export type DocsVolumeTier =
  | 'starter'
  | 'growth'
  | 'professional'
  | 'enterprise'
  | null;

type TryitContextResponse = {
  signedIn: boolean;
  useTestKey?: boolean;
  organizations: DocsWorkspaceOrg[];
  selectedOrganizationId: string | null;
  testApiKey?: string | null;
  pricingPlan?: DocsPricingPlan;
  volumeTier?: DocsVolumeTier;
};

type DocsWorkspaceValue = {
  ready: boolean;
  signedIn: boolean;
  organizations: DocsWorkspaceOrg[];
  selectedOrganizationId: string | null;
  apiKeyResolution: ApiKeyResolution;
  pricingPlan: DocsPricingPlan;
  volumeTier: DocsVolumeTier;
  personalizeSnippet: (source: string) => string;
};

const DocsWorkspaceContext = createContext<DocsWorkspaceValue | null>(null);

export function DocsWorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ctx, setCtx] = useState<TryitContextResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = readStoredOrgId();
        const response = await fetch('/api/tryit-context', {
          credentials: 'include',
        });
        if (!response.ok) {
          if (!cancelled) setReady(true);
          return;
        }
        const body = (await response.json()) as TryitContextResponse;
        if (cancelled) return;
        if (
          stored &&
          body.organizations.some((org) => org.id === stored) &&
          body.selectedOrganizationId !== stored
        ) {
          body.selectedOrganizationId = stored;
        }
        setCtx(body);
      } catch {
        /* signed-out / offline */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apiKeyResolution = resolveTestApiKeyDisplay(ctx?.testApiKey);
  const personalizeSnippet = useCallback(
    (source: string) =>
      applyPersonalize(source, { apiKey: apiKeyResolution }),
    [apiKeyResolution],
  );

  const value = useMemo<DocsWorkspaceValue>(
    () => ({
      ready,
      signedIn: Boolean(ctx?.signedIn),
      organizations: ctx?.organizations ?? [],
      selectedOrganizationId: ctx?.selectedOrganizationId ?? null,
      apiKeyResolution,
      pricingPlan: ctx?.pricingPlan ?? null,
      volumeTier: ctx?.volumeTier ?? null,
      personalizeSnippet,
    }),
    [ready, ctx, apiKeyResolution, personalizeSnippet],
  );

  return (
    <DocsWorkspaceContext.Provider value={value}>
      {children}
    </DocsWorkspaceContext.Provider>
  );
}

export function useDocsWorkspace(): DocsWorkspaceValue {
  const value = useContext(DocsWorkspaceContext);
  if (!value) {
    return {
      ready: true,
      signedIn: false,
      organizations: [],
      selectedOrganizationId: null,
      apiKeyResolution: { kind: 'placeholder' },
      pricingPlan: null,
      volumeTier: null,
      personalizeSnippet: (source) => source,
    };
  }
  return value;
}

export function persistWorkspaceOrg(id: string | null): void {
  writeStoredOrgId(id);
}
