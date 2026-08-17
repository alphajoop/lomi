export type ProcessingFeeRate = {
  provider_code: string;
  payment_method_code: string;
  percentage: number;
  fixed_amount: number;
  micro_threshold: number;
};

/** Maps hosted-checkout payment method id to fee lookup keys. */
export function mapCheckoutMethodToFeeKey(method: string | null): {
  provider: string;
  paymentMethod: string;
} | null {
  if (!method) return null;
  const normalized = method.toLowerCase();
  switch (normalized) {
    case "wave":
      return { provider: "WAVE", paymentMethod: "MOBILE_MONEY" };
    case "mtn":
      return { provider: "MTN", paymentMethod: "MOBILE_MONEY" };
    case "cards":
    case "stripe":
      return { provider: "STRIPE", paymentMethod: "CARDS" };
    case "gim":
      return { provider: "GIM", paymentMethod: "CARDS" };
    case "spi":
      return { provider: "SPI", paymentMethod: "BANK_TRANSFER" };
    default:
      return null;
  }
}

export function findProcessingFeeRate(
  rates: ProcessingFeeRate[] | undefined,
  method: string | null,
): ProcessingFeeRate | null {
  const key = mapCheckoutMethodToFeeKey(method);
  if (!key || !rates?.length) return null;
  return (
    rates.find(
      (r) =>
        r.provider_code === key.provider &&
        r.payment_method_code === key.paymentMethod,
    ) ?? null
  );
}

/**
 * Gross-up surcharge so merchant nets base after lomi fee(rate on payable).
 * Mirrors calculate_passed_processing_fee SQL (ceil for XOF).
 */
export function calculateProcessingFeeSurcharge(
  baseAmount: number,
  rate: ProcessingFeeRate,
  currencyCode: string,
): number {
  if (baseAmount <= 0) return 0;

  const percentage = rate.percentage ?? 0;
  const fixed = rate.fixed_amount ?? 0;
  const micro = rate.micro_threshold ?? 1000;

  if (percentage >= 100) return 0;

  const rateFactor = 1 - percentage / 100;
  if (rateFactor <= 0) return 0;

  const withFixed = (baseAmount + fixed) / rateFactor;
  let payable = withFixed >= micro ? withFixed : baseAmount / rateFactor;

  if (currencyCode === "XOF") {
    payable = Math.ceil(payable);
  } else {
    payable = Math.ceil(payable * 100) / 100;
  }

  return Math.max(payable - baseAmount, 0);
}

/** Hero/headline amount: subtotal until a processing surcharge is active, then total due. */
export function getCheckoutHeadlineAmount(
  priceInfo: { total: number; processingFee?: number },
  subtotalAmount: number,
): number {
  if ((priceInfo.processingFee ?? 0) > 0) {
    return priceInfo.total;
  }
  return subtotalAmount;
}
