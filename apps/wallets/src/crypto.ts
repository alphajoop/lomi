import { createHash, randomBytes } from 'node:crypto';

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function generateOwnerSessionToken(): string {
  return `lomi_owner_${randomBytes(32).toString('base64url')}`;
}

export function generateVirtualWalletKey(): string {
  return `lomi_vw_${randomBytes(32).toString('base64url')}`;
}

export function keyPrefix(secret: string): string {
  return secret.slice(0, 12);
}
