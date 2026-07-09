export const MERCHANT_OAUTH_SCOPES = ['merchant.read', 'merchant.write'] as const;

export type MerchantOAuthScope = (typeof MERCHANT_OAUTH_SCOPES)[number];

export function isMerchantOAuthEnabled(): boolean {
  const raw = process.env.LOMI_MERCHANT_OAUTH_ENABLED?.trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'off') return false;
  return raw === '1' || raw === 'true' || raw === 'on';
}

export function parseRequestedScopes(scope?: string): string[] {
  return (scope ?? '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isMerchantScopeRequest(scope?: string): boolean {
  const parts = parseRequestedScopes(scope);
  return parts.some(
    (part) => part === 'merchant.read' || part === 'merchant.write',
  );
}

export function resolveMerchantAccessLevel(scope?: string): 'read' | 'write' {
  const parts = parseRequestedScopes(scope);
  if (parts.includes('merchant.write')) return 'write';
  return 'read';
}

export function normalizeMerchantScope(accessLevel: 'read' | 'write'): string {
  return accessLevel === 'write' ? 'merchant.write' : 'merchant.read';
}
