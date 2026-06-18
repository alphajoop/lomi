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
  const { data, error } = await supabase
    .getClient()
    .from('api_idempotency_records')
    .select('request_fingerprint, response_payload')
    .eq('organization_id', lookup.organizationId)
    .eq('environment', lookup.environment)
    .eq('endpoint_route', lookup.endpointRoute)
    .eq('idempotency_key', lookup.key.trim())
    .maybeSingle();

  if (error || !data) {
    return { kind: 'miss' };
  }

  const fingerprint =
    typeof data.request_fingerprint === 'string'
      ? data.request_fingerprint.trim()
      : '';
  if (fingerprint !== lookup.bodyHash.trim()) {
    throw new ConflictException('idempotency_key_conflict');
  }

  return { kind: 'hit', payload: data.response_payload };
}

export type IdempotentCreateResult<T> = {
  data: T;
  idempotencyCacheHit?: boolean;
};
