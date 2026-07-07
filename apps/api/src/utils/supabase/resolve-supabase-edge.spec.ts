import { ConfigService } from '@nestjs/config';
import {
  parseSupabaseProjectRefFromUrl,
  resolveSupabaseEdgeInvocation,
  resolveSupabasePublishableKey,
} from './resolve-supabase-edge';

describe('resolveSupabaseEdgeInvocation', () => {
  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PROJECT_REF;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.DB_PUBLISHABLE_KEY;
  });

  it('derives project ref from SUPABASE_URL when SUPABASE_PROJECT_REF is unset', () => {
    process.env.SUPABASE_URL = 'https://mdswvokxrnfggrujsfjd.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'anon_key';

    const config = resolveSupabaseEdgeInvocation(undefined);
    expect(config).toEqual({
      projectRef: 'mdswvokxrnfggrujsfjd',
      publishableKey: 'anon_key',
      functionsBaseUrl: 'https://mdswvokxrnfggrujsfjd.supabase.co/functions/v1',
    });
  });

  it('prefers explicit SUPABASE_PROJECT_REF over URL parsing', () => {
    process.env.SUPABASE_URL = 'https://from-url.supabase.co';
    process.env.SUPABASE_PROJECT_REF = 'explicit-ref';
    process.env.DB_PUBLISHABLE_KEY = 'db_anon';

    const config = resolveSupabaseEdgeInvocation(undefined);
    expect(config?.projectRef).toBe('explicit-ref');
    expect(config?.publishableKey).toBe('db_anon');
  });

  it('returns null when publishable key is missing', () => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    expect(resolveSupabaseEdgeInvocation(undefined)).toBeNull();
  });

  it('reads from ConfigService when provided', () => {
    const configService = {
      get: (key: string) => {
        if (key === 'SUPABASE_URL') return 'https://cfg.supabase.co';
        if (key === 'SUPABASE_PUBLISHABLE_KEY') return 'cfg_anon';
        return undefined;
      },
    } as ConfigService;

    const config = resolveSupabaseEdgeInvocation(configService);
    expect(config?.projectRef).toBe('cfg');
    expect(config?.publishableKey).toBe('cfg_anon');
  });
});

describe('parseSupabaseProjectRefFromUrl', () => {
  it('parses standard Supabase hostnames', () => {
    expect(parseSupabaseProjectRefFromUrl('https://abc-123.supabase.co')).toBe(
      'abc-123',
    );
  });

  it('returns undefined for non-Supabase hosts', () => {
    expect(
      parseSupabaseProjectRefFromUrl('https://example.com'),
    ).toBeUndefined();
  });
});

describe('resolveSupabasePublishableKey', () => {
  afterEach(() => {
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.DB_PUBLISHABLE_KEY;
  });

  it('falls back to DB_PUBLISHABLE_KEY', () => {
    process.env.DB_PUBLISHABLE_KEY = 'db_key';
    expect(resolveSupabasePublishableKey(undefined)).toBe('db_key');
  });
});
