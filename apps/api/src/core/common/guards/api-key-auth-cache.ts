import { createHash } from 'crypto';
import { RedisService } from '../../../utils/redis/redis.service';

/** TTL for non-network API key identity cache (seconds). */
export const API_KEY_AUTH_CACHE_TTL_SECONDS = 60;

export type ApiKeyAuthCachePayload = {
  merchantId: string;
  actorOrganizationId: string;
  targetOrganizationId: string;
  organizationId: string;
  environment: string;
  isNetworkRequest: boolean;
  networkAccountId: string | null;
  networkMembershipId: string | null;
  publicAccountId: string | null;
  networkCapabilityKey: string | null;
};

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 32);
}

/**
 * Cache key for API-key identity only (no Lomi-Account / network capability).
 * Network requests always miss so capability resolution stays accurate.
 */
export function apiKeyAuthCacheKey(apiKey: string): string {
  return `lomi:api-key-auth:v1:${hashApiKey(apiKey)}`;
}

export async function readApiKeyAuthCache(
  redis: RedisService,
  apiKey: string,
): Promise<ApiKeyAuthCachePayload | null> {
  const raw = await redis.get(apiKeyAuthCacheKey(apiKey));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ApiKeyAuthCachePayload;
    if (
      !parsed?.merchantId ||
      !parsed?.organizationId ||
      typeof parsed.environment !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeApiKeyAuthCache(
  redis: RedisService,
  apiKey: string,
  payload: ApiKeyAuthCachePayload,
): Promise<void> {
  if (payload.isNetworkRequest) {
    return;
  }

  await redis.setex(
    apiKeyAuthCacheKey(apiKey),
    API_KEY_AUTH_CACHE_TTL_SECONDS,
    JSON.stringify(payload),
  );
}
