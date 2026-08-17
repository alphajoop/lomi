import type { DbFunctions, TypedSupabaseClient } from "./types.js";

type RpcResult<Fn extends keyof DbFunctions> = PromiseLike<{
  data: DbFunctions[Fn]["Returns"] | null;
  error: Error | null;
}>;

/**
 * Typed `client.rpc` — no singleton. Apps pass browser or server clients.
 * Prefer this over `client.rpc(... as never)` to avoid TS2589 on CI.
 */
export function rpc<Fn extends keyof DbFunctions>(
  client: TypedSupabaseClient,
  fn: Fn,
  args: DbFunctions[Fn]["Args"],
): RpcResult<Fn> {
  // Explicit annotation avoids TS7056 (rpc return type is too large to serialize).
  // SAFETY: client.rpc is untyped at the boundary (cross-version supabase-js).
  return (client.rpc as (...a: never[]) => RpcResult<Fn>)(
    fn as never,
    args as never,
  );
}
