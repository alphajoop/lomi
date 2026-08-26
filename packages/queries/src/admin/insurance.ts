import { handleSupabaseRpc } from "@lomi./shared";
import type { TypedSupabaseClient } from "../types.js";

type RpcArgs = Record<string, unknown>;

export {
  adminSetNitroSettings,
  reverseNitroAdvance,
  reconcileNitroAdvances,
} from "../nitro.js";

export async function adminUpsertInsuranceCarrier(
  client: TypedSupabaseClient,
  args: RpcArgs,
): Promise<string> {
  const data = await handleSupabaseRpc(
    client.rpc("admin_upsert_insurance_carrier" as never, args as never),
    "admin_upsert_insurance_carrier",
  );
  if (typeof data !== "string" || !data) {
    throw new Error("admin_upsert_insurance_carrier returned no id");
  }
  return data;
}

export async function adminUpsertInsuranceProduct(
  client: TypedSupabaseClient,
  args: RpcArgs,
): Promise<string> {
  const data = await handleSupabaseRpc(
    client.rpc("admin_upsert_insurance_product" as never, args as never),
    "admin_upsert_insurance_product",
  );
  if (typeof data !== "string" || !data) {
    throw new Error("admin_upsert_insurance_product returned no id");
  }
  return data;
}

export async function adminQuoteInsuranceRequest(
  client: TypedSupabaseClient,
  args: RpcArgs,
): Promise<void> {
  await handleSupabaseRpc(
    client.rpc("admin_quote_insurance_request" as never, args as never),
    "admin_quote_insurance_request",
    { expectReturnValue: false },
  );
}

export async function adminIssueInsurancePolicy(
  client: TypedSupabaseClient,
  args: RpcArgs,
): Promise<string> {
  const data = await handleSupabaseRpc(
    client.rpc("admin_issue_insurance_policy" as never, args as never),
    "admin_issue_insurance_policy",
  );
  if (typeof data !== "string" || !data) {
    throw new Error("admin_issue_insurance_policy returned no id");
  }
  return data;
}
