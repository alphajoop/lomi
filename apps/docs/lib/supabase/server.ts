/* @proprietary license */

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  // Read the same session namespace as apps/dashboard for API Try It SSO.
  const dashboardAuthStorageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-dashboard-auth`;

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: dashboardAuthStorageKey,
      autoRefreshToken: true,
      persistSession: true,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              domain: isProduction ? '.lomi.africa' : options.domain,
              path: options.path || '/',
              sameSite: options.sameSite || ('lax' as const),
              secure: isProduction ? true : options.secure,
            };
            cookieStore.set(name, value, cookieOptions);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });

  return client;
}

// Simple anonymous client for public data access
export function createAnonymousClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
