import { handleSupabaseRpc } from "@lomi./shared";
import type { TypedSupabaseClient } from "./types.js";

export type MemberLimitRow = {
  merchant_org_id: string;
  merchant_id: string;
  currency_code: string;
  max_charge_amount: number | null;
  daily_charge_total: number | null;
  max_refund_amount: number | null;
  daily_payout_total: number | null;
};

export async function fetchOrganizationMemberLimits(
  client: TypedSupabaseClient,
  args: { p_organization_id: string },
): Promise<MemberLimitRow[]> {
  const data = await handleSupabaseRpc(
    client.rpc("fetch_organization_member_limits" as never, args as never),
    "fetch_organization_member_limits",
    { fallbackValue: [] },
  );
  return (data as MemberLimitRow[] | null) ?? [];
}

export async function upsertOrganizationMemberLimits(
  client: TypedSupabaseClient,
  args: {
    p_organization_id: string;
    p_merchant_id: string;
    p_currency_code: string;
    p_max_charge_amount?: number | null;
    p_daily_charge_total?: number | null;
    p_max_refund_amount?: number | null;
    p_daily_payout_total?: number | null;
  },
): Promise<void> {
  await handleSupabaseRpc(
    client.rpc("upsert_organization_member_limits" as never, args as never),
    "upsert_organization_member_limits",
    { expectReturnValue: false },
  );
}
