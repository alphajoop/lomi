/* @proprietary license */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COOKIE_TRYIT_ORG,
  COOKIE_TRYIT_USE_TEST_KEY,
} from '@/lib/tryit/constants';
import { docsApiGet, getDocsSessionToken } from '@/lib/docs-session';
import { resolveTestSecretApiKey } from '@/lib/resolve-test-api-key';

type TryitContextResponse = {
  signedIn: boolean;
  userId?: string;
  organizations: { id: string; name: string }[];
};

export async function GET() {
  const token = await getDocsSessionToken();
  const c = await cookies();
  const useTestKey = c.get(COOKIE_TRYIT_USE_TEST_KEY)?.value === 'true';
  const cookieOrg = c.get(COOKIE_TRYIT_ORG)?.value ?? null;

  if (!token) {
    return NextResponse.json({
      signedIn: false,
      useTestKey,
      organizations: [] as { id: string; name: string }[],
      selectedOrganizationId: null as string | null,
      needsOrganizationChoice: false,
      testApiKey: null as string | null,
      pricingPlan: null,
      volumeTier: null,
    });
  }

  const context = await docsApiGet<TryitContextResponse>(
    '/auth/docs-session/tryit-context',
    token,
  );

  const organizations = context?.organizations ?? [];

  if (!context?.signedIn || organizations.length === 0) {
    return NextResponse.json({
      signedIn: Boolean(context?.signedIn),
      useTestKey,
      organizations,
      selectedOrganizationId: null,
      needsOrganizationChoice: false,
      testApiKey: null,
      pricingPlan: null,
      volumeTier: null,
    });
  }

  const selectedOrganizationId =
    cookieOrg && organizations.some((o) => o.id === cookieOrg)
      ? cookieOrg
      : organizations.length === 1
        ? organizations[0]!.id
        : null;

  const testApiKey = selectedOrganizationId
    ? await resolveTestSecretApiKey({
        activeOrganizationId: selectedOrganizationId,
      })
    : null;

  return NextResponse.json({
    signedIn: true,
    useTestKey,
    organizations,
    selectedOrganizationId,
    needsOrganizationChoice:
      organizations.length > 1 && selectedOrganizationId === null,
    testApiKey: testApiKey?.startsWith('lomi_sk_test_') ? testApiKey : null,
    pricingPlan: null,
    volumeTier: null,
  });
}
