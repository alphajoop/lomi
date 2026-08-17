export const CHECKOUT_CURRENCY_CODES = ["XOF", "USD", "EUR"] as const;

export type CheckoutCurrencyCode = (typeof CHECKOUT_CURRENCY_CODES)[number];

export function isCheckoutCurrencyCode(
  value: string,
): value is CheckoutCurrencyCode {
  for (const code of CHECKOUT_CURRENCY_CODES) {
    if (code === value) return true;
  }
  return false;
}

export function parseCheckoutCurrencyCode(
  value: string | undefined | null,
  fallback: CheckoutCurrencyCode = "XOF",
): CheckoutCurrencyCode {
  if (value !== undefined && value !== null && isCheckoutCurrencyCode(value)) {
    return value;
  }
  return fallback;
}
