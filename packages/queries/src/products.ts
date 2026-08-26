import { handleSupabaseRpc } from "@lomi./shared";
import type { Database } from "@lomi./shared/database";
import { rpc } from "./rpc.js";
import type { TypedSupabaseClient } from "./types.js";

export type FetchProductsRow =
  Database["public"]["Functions"]["fetch_products"]["Returns"][number];

export type FetchProductsArgs = {
  merchantId: string;
  organizationId?: string;
  isActive?: boolean | null;
  limit?: number;
  offset?: number;
  environment?: string;
  search?: string;
};

export type FetchProductsResult = {
  rows: FetchProductsRow[];
  total_count: number;
};

/**
 * Raw `fetch_products` RPC. Apps map rows into their Product UI types.
 */
export async function fetchProducts(
  client: TypedSupabaseClient,
  args: FetchProductsArgs,
): Promise<FetchProductsResult> {
  if (!args.merchantId) {
    return { rows: [], total_count: 0 };
  }

  const rpcArgs: Database["public"]["Functions"]["fetch_products"]["Args"] = {
    p_merchant_id: args.merchantId,
    p_organization_id: args.organizationId,
    p_is_active: args.isActive === null ? undefined : args.isActive,
    p_limit: args.limit,
    p_offset: args.offset,
    p_environment: args.environment,
    p_search: args.search,
  };

  const data = await handleSupabaseRpc(
    rpc(client, "fetch_products", rpcArgs),
    "fetch_products",
    null,
  );

  if (!data || data.length === 0) {
    return { rows: [], total_count: 0 };
  }

  return {
    rows: data,
    total_count: data[0]?.total_count ?? 0,
  };
}

export type ActiveSubscriptionsByProductRow =
  Database["public"]["Functions"]["get_active_subscriptions_by_product"]["Returns"][number];

export async function getActiveSubscriptionsByProduct(
  client: TypedSupabaseClient,
  args: Database["public"]["Functions"]["get_active_subscriptions_by_product"]["Args"],
): Promise<ActiveSubscriptionsByProductRow[]> {
  const data = await handleSupabaseRpc(
    rpc(client, "get_active_subscriptions_by_product", args),
    "get_active_subscriptions_by_product",
    null,
  );
  return data ?? [];
}

export * from "./products-ops.js";
