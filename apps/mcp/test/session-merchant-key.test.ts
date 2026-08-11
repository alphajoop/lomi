import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request } from 'express';

vi.mock('../src/env-config.js', () => ({
  isMcpTransportBearerToken: vi.fn(),
}));

import { isMcpTransportBearerToken } from '../src/env-config.js';
import {
  extractSessionMerchantApiKey,
  looksLikeLomiApiCredential,
} from '../src/session-merchant-key.js';

const mockIsTransportBearer = vi.mocked(isMcpTransportBearerToken);

function req(headers: Record<string, string | string[] | undefined>): Request {
  return { headers } as Request;
}

describe('looksLikeLomiApiCredential', () => {
  it('accepts known prefixes', () => {
    expect(
      looksLikeLomiApiCredential('lomi_mcp_' + 'a'.repeat(20)),
    ).toBe(true);
    expect(
      looksLikeLomiApiCredential('lomi_cli_' + 'b'.repeat(20)),
    ).toBe(true);
    expect(
      looksLikeLomiApiCredential('lomi_sk_' + 'c'.repeat(20)),
    ).toBe(true);
  });

  it('rejects short or unrelated tokens', () => {
    expect(looksLikeLomiApiCredential('lomi_')).toBe(false);
    expect(looksLikeLomiApiCredential('secret')).toBe(false);
  });
});

describe('extractSessionMerchantApiKey', () => {
  beforeEach(() => {
    mockIsTransportBearer.mockReturnValue(false);
  });

  it('prefers explicit API key headers', () => {
    expect(
      extractSessionMerchantApiKey(
        req({
          'x-lomi-api-key': 'lomi_mcp_one',
          authorization: 'Bearer lomi_mcp_two',
        }),
      ),
    ).toBe('lomi_mcp_one');
  });

  it('reads x-api-key', () => {
    expect(
      extractSessionMerchantApiKey(
        req({
          'x-api-key': 'lomi_sk_testkey123456789012345678901234567890',
        }),
      ),
    ).toBe('lomi_sk_testkey123456789012345678901234567890');
  });

  it('reads Bearer merchant credential when transport bearer unset', () => {
    mockIsTransportBearer.mockReturnValue(false);
    expect(
      extractSessionMerchantApiKey(
        req({ authorization: 'Bearer lomi_mcp_abcdefghijklmnop' }),
      ),
    ).toBe('lomi_mcp_abcdefghijklmnop');
  });

  it('ignores Bearer when it matches any MCP transport secret', () => {
    mockIsTransportBearer.mockImplementation(
      (t) => t === 'transport-secret' || t === 'transport-secret-2',
    );
    expect(
      extractSessionMerchantApiKey(
        req({ authorization: 'Bearer transport-secret' }),
      ),
    ).toBe(null);
    expect(
      extractSessionMerchantApiKey(
        req({ authorization: 'Bearer transport-secret-2' }),
      ),
    ).toBe(null);
  });
});
