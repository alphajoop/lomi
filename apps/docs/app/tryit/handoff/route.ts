/* @proprietary license */

import { NextRequest, NextResponse } from 'next/server';
import {
  docsSessionCookieName,
  docsSessionCookieOptions,
  getApiBaseUrl,
} from '@/lib/docs-session';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') || '/docs/api';
  const fallback = req.nextUrl.clone();
  fallback.pathname = '/docs/api';
  fallback.search = '';

  if (!code || !code.startsWith('lomi_bh_')) {
    return NextResponse.redirect(fallback);
  }

  const consume = await fetch(`${getApiBaseUrl()}/auth/docs-handoff/consume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: req.nextUrl.origin,
    },
    body: JSON.stringify({ code }),
  });

  if (!consume.ok) {
    return NextResponse.redirect(fallback);
  }

  const payload = (await consume.json()) as {
    session_token?: string;
    expires_in?: number;
  };
  if (!payload.session_token) {
    return NextResponse.redirect(fallback);
  }

  const dest = req.nextUrl.clone();
  dest.pathname = next.startsWith('/') ? next : `/${next}`;
  dest.search = '';
  const res = NextResponse.redirect(dest);
  res.cookies.set(
    docsSessionCookieName(),
    payload.session_token,
    docsSessionCookieOptions(payload.expires_in),
  );
  return res;
}
