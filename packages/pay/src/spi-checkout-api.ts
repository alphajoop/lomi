import {
  isJsonObject,
  isString,
  readArray,
  readBoolean,
  readNumber,
  readString,
  validateJsonValue,
  type JsonValue,
} from "@lomi./shared";
/**
 * Client for the public hosted-checkout SPI endpoints on the lomi API
 * (no auth — the checkout_session_id is the capability).
 */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.lomi.africa"
).replace(/\/+$/, "");

export type SpiRequestToPayResult = {
  checkoutSessionId: string;
  spiTxId: string;
  amount: number;
  currency: string;
  expiresAt: string | null;
  transactionId: string | null;
  alreadyInitiated: boolean;
};

export type SpiPaymentStatusResult = {
  checkout_session_id: string;
  checkout_session_status: string;
  amount: number;
  currency_code: string;
  expires_at: string | null;
  spi_tx_id: string | null;
  payment_request_id: string | null;
  payment_request_status: string | null;
  spi_payment_status: string | null;
  transaction_id: string | null;
  transaction_status: string | null;
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
    // ignore — fall through to status text
  }
  return response.statusText || "SPI request failed";
}

function parseSpiRequestToPayResult(data: JsonValue): SpiRequestToPayResult {
  if (!isJsonObject(data)) {
    throw new Error("Invalid SPI request-to-pay response");
  }
  const checkoutSessionId = readString(data, "checkoutSessionId");
  const spiTxId = readString(data, "spiTxId");
  const amount = readNumber(data, "amount");
  const currency = readString(data, "currency");
  if (!checkoutSessionId || !spiTxId || amount === undefined || !currency) {
    throw new Error("Invalid SPI request-to-pay response");
  }
  return {
    checkoutSessionId,
    spiTxId,
    amount,
    currency,
    expiresAt: readString(data, "expiresAt") ?? null,
    transactionId: readString(data, "transactionId") ?? null,
    alreadyInitiated: readBoolean(data, "alreadyInitiated") ?? false,
  };
}

function parseSpiPaymentStatusResult(data: JsonValue): SpiPaymentStatusResult {
  if (!isJsonObject(data)) {
    throw new Error("Invalid SPI payment status response");
  }
  const checkout_session_id = readString(data, "checkout_session_id");
  const checkout_session_status = readString(data, "checkout_session_status");
  const amount = readNumber(data, "amount");
  const currency_code = readString(data, "currency_code");
  if (
    !checkout_session_id ||
    !checkout_session_status ||
    amount === undefined ||
    !currency_code
  ) {
    throw new Error("Invalid SPI payment status response");
  }
  return {
    checkout_session_id,
    checkout_session_status,
    amount,
    currency_code,
    expires_at: readString(data, "expires_at") ?? null,
    spi_tx_id: readString(data, "spi_tx_id") ?? null,
    payment_request_id: readString(data, "payment_request_id") ?? null,
    payment_request_status: readString(data, "payment_request_status") ?? null,
    spi_payment_status: readString(data, "spi_payment_status") ?? null,
    transaction_id: readString(data, "transaction_id") ?? null,
    transaction_status: readString(data, "transaction_status") ?? null,
  };
}

export async function initSpiRequestToPay(params: {
  checkoutSessionId: string;
  payeurAlias: string;
}): Promise<SpiRequestToPayResult> {
  const response = await fetch(`${API_BASE_URL}/checkout/spi/request-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseSpiRequestToPayResult(validateJsonValue(await response.json()));
}

export async function getSpiPaymentStatus(
  checkoutSessionId: string,
): Promise<SpiPaymentStatusResult> {
  const response = await fetch(
    `${API_BASE_URL}/checkout/spi/payments/${checkoutSessionId}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return parseSpiPaymentStatusResult(validateJsonValue(await response.json()));
}
