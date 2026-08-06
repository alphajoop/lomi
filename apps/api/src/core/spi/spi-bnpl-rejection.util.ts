export type SpiBnplRejectionCode =
  | 'AG03'
  | 'AM14'
  | 'BE23'
  | 'AC04'
  | 'AC06'
  | string;

export type SpiBnplRejectionPayload = {
  message: string;
  spiRejectionCode: SpiBnplRejectionCode;
  suggestInstantPayFallback: boolean;
};

const BNPL_REJECTION_MESSAGES: Record<string, string> = {
  AG03:
    'Your bank did not authorize deferred debit for this payment. This is decided by your bank, not the merchant.',
  AM14:
    'This installment amount exceeds your deferred-debit limit with your bank. Try a smaller purchase or pay in full.',
  BE23:
    'The SPI alias you entered is invalid or does not exist. Check the alias and try again.',
  AC04: 'Your payer account is closed. Use another payment method.',
  AC06: 'Your payer account is blocked. Use another payment method.',
};

/** Maps PI-SPI statutRaison codes to customer-safe BNPL checkout errors. */
export const mapSpiBnplRejection = (
  code: string | undefined | null,
): SpiBnplRejectionPayload => {
  const normalized = (code ?? '').trim().toUpperCase();
  const known = BNPL_REJECTION_MESSAGES[normalized];

  if (known) {
    return {
      message: known,
      spiRejectionCode: normalized,
      suggestInstantPayFallback: normalized === 'AG03' || normalized === 'AM14',
    };
  }

  return {
    message:
      'Your bank could not accept this installment request. Try instant SPI or another payment method.',
    spiRejectionCode: normalized || 'UNKNOWN',
    suggestInstantPayFallback: true,
  };
};

/** Extracts statutRaison from SDK responses or thrown API errors. */
export const extractSpiRejectionCode = (
  error: unknown,
  spiResponse?: { statutRaison?: string | null },
): string | undefined => {
  if (spiResponse?.statutRaison?.trim()) {
    return spiResponse.statutRaison.trim();
  }

  if (error && typeof error === 'object') {
    const body = error as Record<string, unknown>;
    const nested = body.body as Record<string, unknown> | undefined;
    const statutRaison =
      (nested?.statutRaison as string | undefined) ??
      (body.statutRaison as string | undefined);
    if (statutRaison?.trim()) {
      return statutRaison.trim();
    }

    const message =
      error instanceof Error
        ? error.message
        : typeof body.message === 'string'
          ? body.message
          : '';
    const match = message.match(/\b(AG03|AM14|BE23|AC04|AC06)\b/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return undefined;
};
