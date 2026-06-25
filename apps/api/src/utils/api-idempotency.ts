import { SupabaseService } from './supabase/supabase.service';
import {
  lookupIdempotencyCache,
  type IdempotentCreateResult,
} from './idempotency-cache';

export type ApiIdempotencyContext = {
  key: string;
  bodyHash: string;
};

export type ApiIdempotencyScope = {
  organizationId: string;
  environment: string;
  endpointRoute: string;
};

/** Lookup cached response, run the write, then persist the response for replays. */
export async function withApiIdempotency<T>(
  supabase: SupabaseService,
  scope: ApiIdempotencyScope,
  idempotency: ApiIdempotencyContext | undefined,
  execute: () => Promise<T>,
): Promise<IdempotentCreateResult<T>> {
  if (!idempotency) {
    return { data: await execute() };
  }

  const cached = await lookupIdempotencyCache(supabase, {
    organizationId: scope.organizationId,
    environment: scope.environment,
    endpointRoute: scope.endpointRoute,
    key: idempotency.key,
    bodyHash: idempotency.bodyHash,
  });
  if (cached.kind === 'hit') {
    return { data: cached.payload as T, idempotencyCacheHit: true };
  }

  const data = await execute();
  await recordIdempotencyCache(supabase, scope, idempotency, data);
  return { data };
}

async function recordIdempotencyCache(
  supabase: SupabaseService,
  scope: ApiIdempotencyScope,
  idempotency: ApiIdempotencyContext,
  payload: unknown,
): Promise<void> {
  const { error } = await (supabase.getClient() as any).rpc(
    'record_api_idempotency_record',
    {
      p_organization_id: scope.organizationId,
      p_environment: scope.environment,
      p_endpoint_route: scope.endpointRoute,
      p_idempotency_key: idempotency.key.trim(),
      p_request_fingerprint: idempotency.bodyHash.trim(),
      p_response_payload: JSON.parse(JSON.stringify(payload)),
    },
  );

  if (error?.message?.includes('idempotency_key_conflict')) {
    const cached = await lookupIdempotencyCache(supabase, {
      organizationId: scope.organizationId,
      environment: scope.environment,
      endpointRoute: scope.endpointRoute,
      key: idempotency.key,
      bodyHash: idempotency.bodyHash,
    });
    if (cached.kind === 'hit') {
      return;
    }
  }

  if (error && !error.message?.includes('duplicate key')) {
    throw error;
  }
}
