/* @proprietary license */

import { type NextRequest, NextResponse } from 'next/server';
import { discoveryLinkHeaderValue } from '@/lib/seo/agent-discovery';
import {
  isDocsMachinePath,
  parseDocsLocalePath,
} from '@/lib/utils/docs-routing';

/**
 * Docs locale (EN/FR) is resolved in server components via `getDocsLocale()` from the
 * `lomi.language` cookie — not via Fumadocs `createI18nMiddleware`, so public URLs stay
 * unchanged (no `/{lang}/...` segment).
 *
 * Old `/en/...` and `/fr/...` links 301 to the unprefixed path.
 *
 * Do not call Supabase auth.getSession() here: docs has no /auth or /workspace routes,
 * and reading shared *.lomi.africa cookies can trigger refresh_token rate limits.
 */
function maybeRedirectLocalePrefix(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const { locale, pathname: strippedPath } = parseDocsLocalePath(pathname);

  if (!locale) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = strippedPath;
  return NextResponse.redirect(url, 301);
}

function withDiscoveryLink(request: NextRequest, response: NextResponse) {
  response.headers.set(
    'Link',
    discoveryLinkHeaderValue(request.nextUrl.origin),
  );
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDocsMachinePath(pathname)) {
    return withDiscoveryLink(request, NextResponse.next());
  }

  const localePrefixRedirect = maybeRedirectLocalePrefix(request);
  if (localePrefixRedirect) {
    return withDiscoveryLink(request, localePrefixRedirect);
  }

  return withDiscoveryLink(request, NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico|json|txt|xml)$).*)',
  ],
};
