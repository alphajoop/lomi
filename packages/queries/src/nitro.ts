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

export type NitroSettingsRow = {
  currency_code: string;
  is_enabled: boolean;
  advance_enabled: boolean;
  advance_limit_amount: number;
  max_advance_hours: number;
  fee_bps: number | null;
  min_fee_amount: number;
  risk_tier: string;
  outstanding_exposure: number;
  held_balance: number;
};

export type NitroQuoteRow = {
  eligible_amount: number;
  fee_amount: number;
  net_amount: number;
  available_after: number;
  reason_ineligible: string | null;
};

export type NitroRequestRow = {
  nitro_request_id: string;
  mode: "rail" | "advance";
  status: string;
  currency_code: string;
  requested_amount: number;
  fee_amount: number;
  net_amount: number;
  payout_id: string | null;
  created_at: string;
};

export async function fetchNitroSettings(
  client: TypedSupabaseClient,
  args: { p_organization_id: string },
): Promise<NitroSettingsRow[]> {
  const data = await pendingRpc<NitroSettingsRow[] | null>(
    client,
    "fetch_nitro_settings",
    args,
    [],
  );
  return data ?? [];
}

export async function quoteNitroSettlement(
  client: TypedSupabaseClient,
  args: {
    p_organization_id: string;
    p_currency_code: string;
    p_mode: "rail" | "advance";
    p_amount: number;
  },
): Promise<NitroQuoteRow[]> {
  const data = await pendingRpc<NitroQuoteRow[] | null>(
    client,
    "quote_nitro_settlement",
    args,
    [],
  );
  return data ?? [];
}

export async function createNitroAdvance(
  client: TypedSupabaseClient,
  args: {
    p_organization_id: string;
    p_currency_code: string;
    p_amount: number;
    p_idempotency_key?: string | null;
    p_merchant_id?: string | null;
  },
): Promise<string> {
  const data = await handleSupabaseRpc(
    client.rpc("create_nitro_advance" as never, args as never),
    "create_nitro_advance",
  );
  if (typeof data !== "string" || !data) {
    throw new Error("create_nitro_advance returned no id");
  }
  return data;
}

export async function recordNitroRail(
  client: TypedSupabaseClient,
  args: {
    p_organization_id: string;
    p_currency_code: string;
    p_amount: number;
    p_payout_id?: string | null;
    p_idempotency_key?: string | null;
    p_merchant_id?: string | null;
  },
): Promise<string> {
  const data = await handleSupabaseRpc(
    client.rpc("record_nitro_rail" as never, args as never),
    "record_nitro_rail",
  );
  if (typeof data !== "string" || !data) {
    throw new Error("record_nitro_rail returned no id");
  }
  return data;
}

export async function fetchNitroRequests(
  client: TypedSupabaseClient,
  args: {
    p_organization_id: string;
    p_page?: number;
    p_page_size?: number;
  },
): Promise<NitroRequestRow[]> {
  const data = await pendingRpc<NitroRequestRow[] | null>(
    client,
    "fetch_nitro_requests",
    args,
    [],
  );
  return data ?? [];
}

export async function getNitroRequest(
  client: TypedSupabaseClient,
  args: { p_organization_id: string; p_nitro_request_id: string },
): Promise<unknown> {
  return handleSupabaseRpc(
    client.rpc("get_nitro_request" as never, args as never),
    "get_nitro_request",
    { fallbackValue: null },
  );
}

export async function adminSetNitroSettings(
  client: TypedSupabaseClient,
  args: RpcArgs,
): Promise<void> {
  await handleSupabaseRpc(
    client.rpc("admin_set_nitro_settings" as never, args as never),
    "admin_set_nitro_settings",
    { expectReturnValue: false },
  );
}

export async function reverseNitroAdvance(
  client: TypedSupabaseClient,
  args: { p_nitro_request_id: string; p_reason?: string | null },
): Promise<void> {
  await handleSupabaseRpc(
    client.rpc("reverse_nitro_advance" as never, args as never),
    "reverse_nitro_advance",
    { expectReturnValue: false },
  );
}

export async function reconcileNitroAdvances(
  client: TypedSupabaseClient,
): Promise<number> {
  const data = await handleSupabaseRpc(
    client.rpc("reconcile_nitro_advances" as never, {} as never),
    "reconcile_nitro_advances",
    { fallbackValue: 0 },
  );
  return typeof data === "number" ? data : 0;
}
