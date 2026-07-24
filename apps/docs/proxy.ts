/* @proprietary license */

import { type NextRequest, NextResponse } from 'next/server';
import { Cookies } from '@/lib/utils/constants';
import {
  DOCS_DEFAULT_LOCALE,
  DOCS_ROUTE_LOCALE_HEADER,
  isDocsMachinePath,
  localizeDocsPath,
  parseDocsLocalePath,
} from '@/lib/utils/docs-routing';

function withDocsRouteLocale(
  request: NextRequest,
  locale: string,
  rewritePath?: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(DOCS_ROUTE_LOCALE_HEADER, locale);

  if (rewritePath !== undefined) {
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function maybeRedirectToPreferredEnglish(
  request: NextRequest,
  pathname: string,
): NextResponse | null {
  const cookieLocale = request.cookies.get(Cookies.Language)?.value;
  if (cookieLocale !== 'en') {
    return null;
  }

  const userAgent = request.headers.get('user-agent') ?? '';
  if (/bot|crawl|spider|slurp|googlebot|bingbot/i.test(userAgent)) {
    return null;
  }

  const localized = localizeDocsPath(pathname, 'en');
  if (localized === pathname) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = localized;
  return NextResponse.redirect(url);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDocsMachinePath(pathname)) {
    return NextResponse.next();
  }

  const { locale, pathname: strippedPath } = parseDocsLocalePath(pathname);

  if (locale === 'en') {
    return withDocsRouteLocale(request, 'en', strippedPath);
  }

  const preferredRedirect = maybeRedirectToPreferredEnglish(request, pathname);
  if (preferredRedirect) {
    return preferredRedirect;
  }

  return withDocsRouteLocale(request, DOCS_DEFAULT_LOCALE);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico|json|txt|xml)$).*)',
  ],
};
