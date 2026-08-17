/* @proprietary license */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COOKIE_TRYIT_ORG,
  COOKIE_TRYIT_USE_TEST_KEY,
} from '@/lib/tryit/constants';
import { docsApiGet, getDocsSessionToken } from '@/lib/docs-session';

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
    });
  }

  const selectedOrganizationId =
    cookieOrg && organizations.some((o) => o.id === cookieOrg)
      ? cookieOrg
      : organizations.length === 1
        ? organizations[0]!.id
        : null;

  return NextResponse.json({
    signedIn: true,
    useTestKey,
    organizations,
    selectedOrganizationId,
    needsOrganizationChoice:
      organizations.length > 1 && selectedOrganizationId === null,
  });
}
