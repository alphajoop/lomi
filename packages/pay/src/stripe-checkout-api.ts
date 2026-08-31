import {
  isJsonObject,
  isString,
  readString,
  validateJsonValue,
  type JsonInputObject,
  type JsonValue,
} from "@lomi./shared";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.lomi.africa"
).replace(/\/+$/, "");

export class StripeCheckoutApiError extends Error {
  code?: string;
}

function errorFromPayload(payload: JsonValue | null, status: number): string {
  if (isJsonObject(payload)) {
    const nested = payload.error;
    if (isString(nested)) return nested;
    const message = readString(payload, "message");
    if (message) return message;
  }
  return `Stripe checkout request failed (${status})`;
}

export type StripeCheckoutIntentResult = {
  success: boolean;
  error?: string;
  code?: string;
  message?: string;
  data?: {
    customer?: string;
    clientSecret?: string;
    id?: string;
    amount?: number;
    currency?: string;
    mode?: "payment" | "setup";
  };
};

export async function postStripePaymentIntent(
  body: JsonInputObject,
): Promise<StripeCheckoutIntentResult> {
  const response = await fetch(
    `${API_BASE_URL}/checkout/stripe/payment-intent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const raw = await response.text();
  let payload: JsonValue | null = null;
  if (raw) {
    try {
      payload = validateJsonValue(JSON.parse(raw));
    } catch {
      payload = raw;
    }
  }
  if (!isJsonObject(payload)) {
    if (!response.ok) {
      throw new StripeCheckoutApiError(
        errorFromPayload(payload, response.status),
      );
    }
    throw new StripeCheckoutApiError("Empty Stripe checkout response");
  }
  // Nest returns 400 with { success: false, error, code } for Stripe
  // business errors (amount_too_small). Surface that instead of throwing
  // so hosted checkout can disable cards instead of killing the session.
  if (!response.ok || payload.success === false) {
    return {
      success: false,
      error: errorFromPayload(payload, response.status),
      code: readString(payload, "code"),
      message: readString(payload, "message"),
    };
  }
  // SAFETY: Nest Stripe checkout JSON matches the hosted checkout contract.
  return {
    ...(payload as StripeCheckoutIntentResult),
    success: true,
  };
}
