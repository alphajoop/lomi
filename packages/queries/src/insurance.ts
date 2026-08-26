import { handleSupabaseRpc } from "@lomi./shared";
import type { TypedSupabaseClient } from "./types.js";

type RpcArgs = Record<string, unknown>;

function pendingRpc<T>(
  client: TypedSupabaseClient,
  fn: string,
  args: RpcArgs,
  fallback: T,
): Promise<T> {
  return handleSupabaseRpc(client.rpc(fn as never, args as never), fn, {
    fallbackValue: fallback as never,
  }) as Promise<T>;
}

export type InsuranceProductRow = {
  product_id: string;
  kind: string;
  name: string;
  description: string | null;
  country_codes: string[];
  coverage_min: number;
  coverage_max: number;
  carrier_name: string | null;
};

export type InsuranceQuoteRequestRow = {
  quote_request_id: string;
  product_id: string;
  product_name: string;
  kind: string;
  requested_coverage: number;
  currency_code: string;
  status: string;
  quoted_premium: number | null;
  notes: string | null;
  created_at: string;
};

export type InsurancePolicyRow = {
  policy_id: string;
  product_name: string;
  kind: string;
  status: string;
  coverage_amount: number;
  currency_code: string;
  starts_at: string | null;
  ends_at: string | null;
};

export async function fetchInsuranceProducts(
  client: TypedSupabaseClient,
  args: { p_organization_id?: string | null },
): Promise<InsuranceProductRow[]> {
  const data = await pendingRpc<InsuranceProductRow[] | null>(
    client,
    "fetch_insurance_products",
    args,
    [],
  );
  return data ?? [];
}

export async function createInsuranceQuoteRequest(
  client: TypedSupabaseClient,
  args: {
    p_organization_id: string;
    p_product_id: string;
    p_requested_coverage: number;
    p_currency_code?: string;
    p_notes?: string | null;
    p_merchant_id?: string | null;
  },
): Promise<string> {
  const data = await handleSupabaseRpc(
    client.rpc("create_insurance_quote_request" as never, args as never),
    "create_insurance_quote_request",
  );
  if (typeof data !== "string" || !data) {
    throw new Error("create_insurance_quote_request returned no id");
  }
  return data;
}

export async function fetchInsuranceQuoteRequests(
  client: TypedSupabaseClient,
  args: { p_organization_id: string },
): Promise<InsuranceQuoteRequestRow[]> {
  const data = await pendingRpc<InsuranceQuoteRequestRow[] | null>(
    client,
    "fetch_insurance_quote_requests",
    args,
    [],
  );
  return data ?? [];
}

export async function fetchInsurancePolicies(
  client: TypedSupabaseClient,
  args: { p_organization_id: string },
): Promise<InsurancePolicyRow[]> {
  const data = await pendingRpc<InsurancePolicyRow[] | null>(
    client,
    "fetch_insurance_policies",
    args,
    [],
  );
  return data ?? [];
}
