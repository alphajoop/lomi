import {
  isJsonObject,
  isString,
  readArray,
  readBoolean,
  readNumber,
  readObject,
  readString,
  validateJsonValue,
  type JsonValue,
} from "@lomi./shared";
/**
 * Client for public hosted-checkout GIM Pay endpoints on the lomi API.
 */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.lomi.africa"
).replace(/\/+$/, "");

export type GimPayResult = {
  success: boolean;
  data?: {
    success?: boolean;
    status?: "approved" | "declined" | "redirect_3ds" | "retry_other_rail";
    system_reference?: number;
    merchant_reference?: string;
    action_code?: string;
    message?: string;
    auth_code?: string;
    transaction_id?: string;
    three_ds_url?: string | null;
  };
  next_action?: {
    type: "redirect" | "await_webhook" | "client_secret";
    url?: string;
    status?: string;
  };
};

async function parseError(response: Response): Promise<string> {
  try {
    const data = validateJsonValue(await response.json());
    if (isJsonObject(data)) {
      const message = data["message"];
      if (isString(message)) return message;
      const parts = readArray(data, "message");
      if (parts) {
        const strings = parts.filter(isString);
        if (strings.length > 0) return strings.join(", ");
      }
    }
  } catch {
    // ignore
  }
  return response.statusText || "GIM payment request failed";
}

function isGimStatus(
  value: string,
): value is NonNullable<NonNullable<GimPayResult["data"]>["status"]> {
  return (
    value === "approved" ||
    value === "declined" ||
    value === "redirect_3ds" ||
    value === "retry_other_rail"
  );
}

function isNextActionType(
  value: string,
): value is NonNullable<GimPayResult["next_action"]>["type"] {
  return (
    value === "redirect" ||
    value === "await_webhook" ||
    value === "client_secret"
  );
}

function parseGimPayResult(data: JsonValue): GimPayResult {
  if (!isJsonObject(data)) {
    throw new Error("Invalid GIM pay response");
  }
  const success = readBoolean(data, "success");
  if (success === undefined) {
    throw new Error("Invalid GIM pay response");
  }

  const result: GimPayResult = { success };

  const payload = readObject(data, "data");
  if (payload) {
    const statusRaw = readString(payload, "status");
    result.data = {
      success: readBoolean(payload, "success"),
      status: statusRaw && isGimStatus(statusRaw) ? statusRaw : undefined,
      system_reference: readNumber(payload, "system_reference"),
      merchant_reference: readString(payload, "merchant_reference"),
      action_code: readString(payload, "action_code"),
      message: readString(payload, "message"),
      auth_code: readString(payload, "auth_code"),
      transaction_id: readString(payload, "transaction_id"),
      three_ds_url: readString(payload, "three_ds_url") ?? null,
    };
  }

  const next = readObject(data, "next_action");
  if (next) {
    const typeRaw = readString(next, "type");
    if (typeRaw && isNextActionType(typeRaw)) {
      result.next_action = {
        type: typeRaw,
        url: readString(next, "url"),
        status: readString(next, "status"),
      };
    }
  }

  return result;
}

export async function initGimCheckoutPayment(params: {
  checkoutSessionId: string;
  pan: string;
  expiry: string;
  cvv: string;
  cardHolderName?: string;
  ecomIp?: string;
}): Promise<GimPayResult> {
  const response = await fetch(`${API_BASE_URL}/checkout/gim/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseGimPayResult(validateJsonValue(await response.json()));
}
