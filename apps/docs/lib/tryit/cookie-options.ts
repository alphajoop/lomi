/* @proprietary license */

/**
 * Align Try-it preference cookies with Supabase session cookie domain strategy
 * ([`lib/supabase/server.ts`](../supabase/server.ts)).
 */
export function tryitPreferenceCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 365,
  };
}
