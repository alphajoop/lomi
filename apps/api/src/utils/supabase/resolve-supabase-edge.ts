import { ConfigService } from '@nestjs/config';

export type SupabaseEdgeInvocationConfig = {
  projectRef: string;
  publishableKey: string;
  functionsBaseUrl: string;
};

function readEnv(
  configService: ConfigService | undefined,
  key: string,
): string {
  const fromConfig = configService?.get<string>(key)?.trim();
  if (fromConfig) return fromConfig;
  return process.env[key]?.trim() ?? '';
}

/** Extract project ref from `https://<ref>.supabase.co`. */
export function parseSupabaseProjectRefFromUrl(
  supabaseUrl: string | undefined,
): string | undefined {
  if (!supabaseUrl?.trim()) return undefined;
  try {
    const hostname = new URL(supabaseUrl.trim()).hostname;
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return match?.[1];
  } catch {
    return undefined;
  }
}

/** Resolve anon/publishable key used to invoke public Supabase edge functions. */
export function resolveSupabasePublishableKey(
  configService?: ConfigService,
): string | undefined {
  for (const key of [
    'SUPABASE_PUBLISHABLE_KEY',
    'DB_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
  ]) {
    const value = readEnv(configService, key);
    if (value) return value;
  }
  return undefined;
}

/** Config needed to call Supabase edge functions from the API (test_webhook, wave, mtn, …). */
export function resolveSupabaseEdgeInvocation(
  configService?: ConfigService,
): SupabaseEdgeInvocationConfig | null {
  const explicitRef = readEnv(configService, 'SUPABASE_PROJECT_REF');
  const supabaseUrl = readEnv(configService, 'SUPABASE_URL');
  const projectRef =
    explicitRef || parseSupabaseProjectRefFromUrl(supabaseUrl) || undefined;
  const publishableKey = resolveSupabasePublishableKey(configService);

  if (!projectRef || !publishableKey) {
    return null;
  }

  return {
    projectRef,
    publishableKey,
    functionsBaseUrl: `https://${projectRef}.supabase.co/functions/v1`,
  };
}
