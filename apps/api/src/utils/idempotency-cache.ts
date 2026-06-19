import { ConflictException } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

export type IdempotencyCacheLookup = {
  organizationId: string;
  environment: string;
  endpointRoute: string;
  key: string;
  bodyHash: string;
};

export type IdempotencyCacheLookupResult =
  | { kind: 'miss' }
  | { kind: 'hit'; payload: unknown };

/** Read a cached idempotent response before invoking the create RPC. */
export async function lookupIdempotencyCache(
  supabase: SupabaseService,
  lookup: IdempotencyCacheLookup,
): Promise<IdempotencyCacheLookupResult> {
  const { data, error } = await (supabase.getClient() as any).rpc(
    'lookup_api_idempotency_record',
    {
      p_organization_id: lookup.organizationId,
      p_environment: lookup.environment,
      p_endpoint_route: lookup.endpointRoute,
      p_idempotency_key: lookup.key.trim(),
    },
  );

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    return { kind: 'miss' };
  }

  const fingerprint =
    typeof row.request_fingerprint === 'string'
      ? row.request_fingerprint.trim()
      : '';
  if (fingerprint !== lookup.bodyHash.trim()) {
    throw new ConflictException('idempotency_key_conflict');
  }

  return { kind: 'hit', payload: row.response_payload };
}

export type IdempotentCreateResult<T> = {
  data: T;
  idempotencyCacheHit?: boolean;
};
