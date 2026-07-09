import {
  isMerchantOAuthEnabled,
  isMerchantScopeRequest,
  normalizeMerchantScope,
  parseRequestedScopes,
  resolveMerchantAccessLevel,
} from './merchant-oauth';

describe('merchant-oauth', () => {
  const original = process.env.LOMI_MERCHANT_OAUTH_ENABLED;

  afterEach(() => {
    process.env.LOMI_MERCHANT_OAUTH_ENABLED = original;
  });

  it('detects merchant scopes', () => {
    expect(isMerchantScopeRequest('merchant.read')).toBe(true);
    expect(isMerchantScopeRequest('merchant.write offline')).toBe(true);
    expect(isMerchantScopeRequest('provisioning.onboard')).toBe(false);
  });

  it('defaults merchant access to read-only', () => {
    expect(resolveMerchantAccessLevel('merchant.read')).toBe('read');
    expect(resolveMerchantAccessLevel('merchant.write')).toBe('write');
    expect(normalizeMerchantScope('read')).toBe('merchant.read');
    expect(normalizeMerchantScope('write')).toBe('merchant.write');
  });

  it('parses scope strings', () => {
    expect(parseRequestedScopes('merchant.read merchant.write')).toEqual([
      'merchant.read',
      'merchant.write',
    ]);
  });

  it('respects feature flag env', () => {
    process.env.LOMI_MERCHANT_OAUTH_ENABLED = 'true';
    expect(isMerchantOAuthEnabled()).toBe(true);
    process.env.LOMI_MERCHANT_OAUTH_ENABLED = 'off';
    expect(isMerchantOAuthEnabled()).toBe(false);
    delete process.env.LOMI_MERCHANT_OAUTH_ENABLED;
    expect(isMerchantOAuthEnabled()).toBe(false);
  });
});
