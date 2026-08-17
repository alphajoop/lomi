/* @proprietary license */

import { docsApiGet, getDocsSessionToken } from '@/lib/docs-session';

export type ResolveTestKeyOptions = {
  activeOrganizationId: string | null;
};

export async function resolveTestSecretApiKey(
  options: ResolveTestKeyOptions,
): Promise<string | null> {
  const token = await getDocsSessionToken();
  if (!token) return null;

  const query = options.activeOrganizationId
    ? `?organizationId=${encodeURIComponent(options.activeOrganizationId)}`
    : '';
  const result = await docsApiGet<{ api_key?: string | null }>(
    `/auth/docs-session/test-key${query}`,
    token,
  );
  return result?.api_key ?? null;
}
