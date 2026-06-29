/** ISO 4217 numeric code for West African CFA franc (XOF). */
export const GIM_CURRENCY_CODE = '952';

export const GIM_AMOUNT_MAX_DIGITS = 15;

export type GimActionOutcome =
  | 'approved'
  | 'declined_final'
  | 'retry_other_rail';

const APPROVED_ACTION_CODES = new Set(['000', '001', '003', '007']);

const SYSTEM_RETRY_ACTION_CODE_PREFIXES = ['8', '9'];

const SYSTEM_RETRY_ACTION_CODES = new Set([
  '300',
  '301',
  '302',
  '303',
  '304',
  '305',
  '306',
  '307',
  '308',
  '309',
  '500',
  '503',
  '581',
  '582',
  '880',
  '888',
  '902',
  '908',
  '909',
  '911',
  '912',
  '992',
  '993',
  '994',
  '995',
]);

const ACTION_CODE_MESSAGES: Record<string, string> = {
  '000': 'Payment accepted',
  '001': 'Payment accepted with identification',
  '003': 'Payment accepted',
  '007': 'Payment accepted',
  '100': 'Card declined',
  '101': 'Card expired',
  '102': 'Fraud detected',
  '116': 'Insufficient funds',
  '110': 'Incorrect amount',
  '111': 'Incorrect card number',
  '117': 'Incorrect PIN',
  '121': 'Withdrawal limit exceeded',
  '183': 'Invalid CVV',
  '184': 'Invalid expiry date',
  '107': 'Refer to card issuer',
  '108': 'Refer to card issuer',
};

let dateTimeLocalTrxnSequence = 0;

export function gateXofAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  if (!Number.isInteger(amount)) {
    throw new Error('XOF amount must be a whole number (no decimals)');
  }
  return amount;
}

export function toGimAmount(
  baseUnitAmount: number,
  multiplier: number,
): number {
  const gated = gateXofAmount(baseUnitAmount);
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error('GIM amount multiplier must be a positive number');
  }
  const minor = Math.round(gated * multiplier);
  if (minor <= 0) {
    throw new Error('Converted GIM amount must be greater than zero');
  }
  const digits = String(minor).length;
  if (digits > GIM_AMOUNT_MAX_DIGITS) {
    throw new Error(
      `GIM AmountTrxn exceeds ${GIM_AMOUNT_MAX_DIGITS} digits (${digits})`,
    );
  }
  return minor;
}

/** Mask PAN to first6/last4 for storage. Never store full PAN or CVV. */
export function maskPan(pan: string): string {
  const digits = pan.replace(/\D/g, '');
  if (digits.length < 10) {
    return '****';
  }
  return `${digits.slice(0, 6)}******${digits.slice(-4)}`;
}

/** Normalize card expiry to GIM `YYMM` format. Accepts `MM/YY`, `MMYY`, or `YYMM`. */
export function toExpiryYyMm(expiry: string): string {
  const trimmed = expiry.replace(/\s/g, '');
  if (/^\d{4}$/.test(trimmed)) {
    const asYyMm = trimmed;
    const month = Number(asYyMm.slice(2, 4));
    if (month >= 1 && month <= 12) {
      return asYyMm;
    }
    const asMmYy = `${trimmed.slice(2, 4)}${trimmed.slice(0, 2)}`;
    return asMmYy;
  }
  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})$/);
  if (slashMatch) {
    const [, mm, yy] = slashMatch;
    return `${yy}${mm}`;
  }
  throw new Error('Card expiry must be MM/YY or YYMM');
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Build `DateTimeLocalTrxn` for GIM request signing.
 * Default: `YYMMDDHHMMSS` (12 chars per spec). Set `digitLength` to 15 if PaySky confirms the sample format.
 */
export function buildDateTimeLocalTrxn(
  now: Date = new Date(),
  digitLength: 12 | 15 = 12,
): string {
  const base =
    pad2(now.getFullYear() % 100) +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds());

  if (digitLength === 12) {
    dateTimeLocalTrxnSequence = (dateTimeLocalTrxnSequence + 1) % 1000;
    return base;
  }

  dateTimeLocalTrxnSequence = (dateTimeLocalTrxnSequence + 1) % 1000;
  return `${base}${String(dateTimeLocalTrxnSequence).padStart(3, '0')}`;
}

export function normalizeActionCode(code: string | null | undefined): string {
  return (code ?? '').trim();
}

export function isApprovedActionCode(code: string | null | undefined): boolean {
  const normalized = normalizeActionCode(code);
  return APPROVED_ACTION_CODES.has(normalized);
}

function isSystemRetryActionCode(code: string): boolean {
  if (SYSTEM_RETRY_ACTION_CODES.has(code)) {
    return true;
  }
  return SYSTEM_RETRY_ACTION_CODE_PREFIXES.some((prefix) =>
    code.startsWith(prefix),
  );
}

export function classifyActionCode(
  actionCode: string | null | undefined,
  transportError?: boolean,
): GimActionOutcome {
  if (transportError) {
    return 'retry_other_rail';
  }

  const code = normalizeActionCode(actionCode);
  if (!code) {
    return 'retry_other_rail';
  }

  if (isApprovedActionCode(code)) {
    return 'approved';
  }

  if (isSystemRetryActionCode(code)) {
    return 'retry_other_rail';
  }

  return 'declined_final';
}

export function actionCodeUserMessage(
  actionCode: string | null | undefined,
  fallback?: string | null,
): string {
  const code = normalizeActionCode(actionCode);
  if (ACTION_CODE_MESSAGES[code]) {
    return ACTION_CODE_MESSAGES[code];
  }
  if (fallback?.trim()) {
    return fallback.trim();
  }
  return 'Payment declined';
}

/** Redact PAN-like sequences, CVV labels, and secrets from log lines. */
export function sanitizeGimLogPayload(value: string): string {
  return value
    .replace(/\b\d{14,19}\b/g, '[REDACTED_PAN]')
    .replace(/\bcvv2?=[^\s&]+/gi, 'cvv=[REDACTED]')
    .replace(/\bkey=[0-9a-f]{32,}/gi, 'key=[REDACTED]')
    .replace(/SecureHash=[0-9A-F]+/gi, 'SecureHash=[REDACTED]');
}

/** Reset in-process sequence counter (tests only). */
export function resetDateTimeLocalTrxnSequenceForTests(): void {
  dateTimeLocalTrxnSequence = 0;
}
