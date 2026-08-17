/* @proprietary license */

import { cookies } from 'next/headers';
import { createSecureOpenApiProxyHandlers } from '@/lib/openapi-secure-proxy';
import { resolveTestSecretApiKey } from '@/lib/resolve-test-api-key';
import {
  COOKIE_TRYIT_ORG,
  COOKIE_TRYIT_USE_TEST_KEY,
} from '@/lib/tryit/constants';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOrgCookie(value: string | undefined): string | null {
  if (!value || !UUID_RE.test(value)) return null;
  return value;
}

const handlers = createSecureOpenApiProxyHandlers({
  async getInjectionContext() {
    const c = await cookies();
    const shouldInjectTestKey =
      c.get(COOKIE_TRYIT_USE_TEST_KEY)?.value === 'true';
    const activeOrganizationId = parseOrgCookie(c.get(COOKIE_TRYIT_ORG)?.value);
    return { shouldInjectTestKey, activeOrganizationId };
  },
  async resolveTestKey({ activeOrganizationId }) {
    return resolveTestSecretApiKey({
      activeOrganizationId,
    });
  },
});

export const GET = handlers.GET;
export const HEAD = handlers.HEAD;
export const PUT = handlers.PUT;
export const POST = handlers.POST;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
