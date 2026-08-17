import { callRpc } from "../call-rpc.js";
import type { DbFunctions, TypedSupabaseClient } from "../types.js";
import type { SupabaseRpcOptions } from "@lomi./shared";

/** Admin growth RPCs — inject platform-admin TypedSupabaseClient. */
export { rpc } from "../rpc.js";

export async function adminApproveGrowthReply(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_approve_growth_reply"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_approve_growth_reply"]["Returns"]> | null,
): Promise<DbFunctions["admin_approve_growth_reply"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_approve_growth_reply", args, "admin_approve_growth_reply", { fallbackValue: null });
  }
  return callRpc(client, "admin_approve_growth_reply", args, "admin_approve_growth_reply", options);
}

export async function adminLogGrowthOutboundTouch(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_log_growth_outbound_touch"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_log_growth_outbound_touch"]["Returns"]> | null,
): Promise<DbFunctions["admin_log_growth_outbound_touch"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_log_growth_outbound_touch", args, "admin_log_growth_outbound_touch", { fallbackValue: null });
  }
  return callRpc(client, "admin_log_growth_outbound_touch", args, "admin_log_growth_outbound_touch", options);
}

export async function adminRejectGrowthReply(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_reject_growth_reply"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_reject_growth_reply"]["Returns"]> | null,
): Promise<DbFunctions["admin_reject_growth_reply"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_reject_growth_reply", args, "admin_reject_growth_reply", { fallbackValue: null });
  }
  return callRpc(client, "admin_reject_growth_reply", args, "admin_reject_growth_reply", options);
}

export async function adminSaveGrowthIcp(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_save_growth_icp"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_save_growth_icp"]["Returns"]> | null,
): Promise<DbFunctions["admin_save_growth_icp"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_save_growth_icp", args, "admin_save_growth_icp", { fallbackValue: null });
  }
  return callRpc(client, "admin_save_growth_icp", args, "admin_save_growth_icp", options);
}

export async function adminUpdateGrowthLeadStatus(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_update_growth_lead_status"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_update_growth_lead_status"]["Returns"]> | null,
): Promise<DbFunctions["admin_update_growth_lead_status"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_update_growth_lead_status", args, "admin_update_growth_lead_status", { fallbackValue: null });
  }
  return callRpc(client, "admin_update_growth_lead_status", args, "admin_update_growth_lead_status", options);
}

export async function adminUpdateGrowthReplyDraft(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_update_growth_reply_draft"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_update_growth_reply_draft"]["Returns"]> | null,
): Promise<DbFunctions["admin_update_growth_reply_draft"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_update_growth_reply_draft", args, "admin_update_growth_reply_draft", { fallbackValue: null });
  }
  return callRpc(client, "admin_update_growth_reply_draft", args, "admin_update_growth_reply_draft", options);
}

export async function adminUpsertGrowthContact(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_upsert_growth_contact"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_upsert_growth_contact"]["Returns"]> | null,
): Promise<DbFunctions["admin_upsert_growth_contact"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_upsert_growth_contact", args, "admin_upsert_growth_contact", { fallbackValue: null });
  }
  return callRpc(client, "admin_upsert_growth_contact", args, "admin_upsert_growth_contact", options);
}

export async function adminUpsertGrowthDeal(
  client: TypedSupabaseClient,
  args: DbFunctions["admin_upsert_growth_deal"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["admin_upsert_growth_deal"]["Returns"]> | null,
): Promise<DbFunctions["admin_upsert_growth_deal"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "admin_upsert_growth_deal", args, "admin_upsert_growth_deal", { fallbackValue: null });
  }
  return callRpc(client, "admin_upsert_growth_deal", args, "admin_upsert_growth_deal", options);
}

export async function getAdminGrowthAgentRuns(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_agent_runs"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_agent_runs"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_agent_runs"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_agent_runs", args, "get_admin_growth_agent_runs", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_agent_runs", args, "get_admin_growth_agent_runs", options);
}

export async function getAdminGrowthContacts(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_contacts"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_contacts"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_contacts"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_contacts", args, "get_admin_growth_contacts", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_contacts", args, "get_admin_growth_contacts", options);
}

export async function getAdminGrowthDeals(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_deals"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_deals"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_deals"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_deals", args, "get_admin_growth_deals", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_deals", args, "get_admin_growth_deals", options);
}

export async function getAdminGrowthIcpActive(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_icp_active"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_icp_active"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_icp_active"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_icp_active", args, "get_admin_growth_icp_active", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_icp_active", args, "get_admin_growth_icp_active", options);
}

export async function getAdminGrowthLeads(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_leads"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_leads"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_leads"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_leads", args, "get_admin_growth_leads", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_leads", args, "get_admin_growth_leads", options);
}

export async function getAdminGrowthLookalikeRuns(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_lookalike_runs"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_lookalike_runs"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_lookalike_runs"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_lookalike_runs", args, "get_admin_growth_lookalike_runs", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_lookalike_runs", args, "get_admin_growth_lookalike_runs", options);
}

export async function getAdminGrowthOutboundTouches(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_outbound_touches"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_outbound_touches"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_outbound_touches"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_outbound_touches", args, "get_admin_growth_outbound_touches", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_outbound_touches", args, "get_admin_growth_outbound_touches", options);
}

export async function getAdminGrowthReplyDrafts(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_reply_drafts"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_reply_drafts"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_reply_drafts"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_reply_drafts", args, "get_admin_growth_reply_drafts", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_reply_drafts", args, "get_admin_growth_reply_drafts", options);
}

export async function getAdminGrowthSequences(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_sequences"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_sequences"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_sequences"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_sequences", args, "get_admin_growth_sequences", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_sequences", args, "get_admin_growth_sequences", options);
}

export async function getAdminGrowthSignalEvents(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_signal_events"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_signal_events"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_signal_events"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_signal_events", args, "get_admin_growth_signal_events", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_signal_events", args, "get_admin_growth_signal_events", options);
}

export async function getAdminGrowthSignals(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_signals"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_signals"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_signals"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_signals", args, "get_admin_growth_signals", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_signals", args, "get_admin_growth_signals", options);
}

export async function getAdminGrowthWinners(
  client: TypedSupabaseClient,
  args: DbFunctions["get_admin_growth_winners"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_admin_growth_winners"]["Returns"]> | null,
): Promise<DbFunctions["get_admin_growth_winners"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_admin_growth_winners", args, "get_admin_growth_winners", { fallbackValue: null });
  }
  return callRpc(client, "get_admin_growth_winners", args, "get_admin_growth_winners", options);
}

export async function getAverageMonthlyGrowthRate(
  client: TypedSupabaseClient,
  args: DbFunctions["get_average_monthly_growth_rate"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_average_monthly_growth_rate"]["Returns"]> | null,
): Promise<DbFunctions["get_average_monthly_growth_rate"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_average_monthly_growth_rate", args, "get_average_monthly_growth_rate", { fallbackValue: null });
  }
  return callRpc(client, "get_average_monthly_growth_rate", args, "get_average_monthly_growth_rate", options);
}

export async function getPlatformGrowthStats(
  client: TypedSupabaseClient,
  args: DbFunctions["get_platform_growth_stats"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_platform_growth_stats"]["Returns"]> | null,
): Promise<DbFunctions["get_platform_growth_stats"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_platform_growth_stats", args, "get_platform_growth_stats", { fallbackValue: null });
  }
  return callRpc(client, "get_platform_growth_stats", args, "get_platform_growth_stats", options);
}

export async function getRawAverageMonthlyGrowthRate(
  client: TypedSupabaseClient,
  args: DbFunctions["get_raw_average_monthly_growth_rate"]["Args"],
  options?: SupabaseRpcOptions<DbFunctions["get_raw_average_monthly_growth_rate"]["Returns"]> | null,
): Promise<DbFunctions["get_raw_average_monthly_growth_rate"]["Returns"] | null | boolean> {
  if (options === null) {
    return callRpc(client, "get_raw_average_monthly_growth_rate", args, "get_raw_average_monthly_growth_rate", { fallbackValue: null });
  }
  return callRpc(client, "get_raw_average_monthly_growth_rate", args, "get_raw_average_monthly_growth_rate", options);
}
