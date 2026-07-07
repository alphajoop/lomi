import type { SupabaseService } from '../../../src/utils/supabase/supabase.service';
import { callFn, type Db } from './client';

function normalizeFnName(fnName: string): string {
  return fnName.startsWith('public.') ? fnName : `public.${fnName}`;
}

async function rpcImpl(
  client: Db,
  fnName: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  try {
    const res = await callFn(client, normalizeFnName(fnName), args);
    if (res.rows.length === 0) {
      return { data: null, error: null };
    }
    if (res.rows.length === 1 && res.rows[0]?.result !== undefined) {
      return { data: res.rows[0].result, error: null };
    }
    if (res.rows.length === 1) {
      return { data: res.rows[0], error: null };
    }
    return { data: res.rows, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: { message } };
  }
}

/**
 * Minimal SupabaseService adapter backed by a pg client for commit tests.
 */
export function createPgSupabase(client: Db): SupabaseService {
  const rpc = (fnName: string, args: Record<string, unknown>) =>
    rpcImpl(client, fnName, args);

  return {
    rpc,
    getClient: () => ({ rpc }),
  } as unknown as SupabaseService;
}
