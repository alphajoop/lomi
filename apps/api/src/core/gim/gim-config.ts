export const GIM_UAT_PAY_BY_CARD_URL =
  'https://omni-uat.gimpay.org/Cube/PayLink.svc/api/PayByCard';

export type GimPlatformConfig = {
  merchantId: string;
  terminalId: string;
  secretKeyHex: string;
  payByCardUrl: string;
  returnUrl: string;
  amountMultiplier: number;
  disable3ds: boolean;
  dateTimeLocalTrxnDigitLength: 12 | 15;
};

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

/** Production NODE_ENV on the sandbox API host should still allow GIM UAT. */
const isStrictProductionGim = (): boolean => {
  if (!isProduction()) {
    return false;
  }
  const apiEnv = (process.env.LOMI_API_ENV || process.env.API_ENV || '')
    .trim()
    .toLowerCase();
  return apiEnv !== 'sandbox' && apiEnv !== 'test';
};

function requireProductionEnv(name: string, value?: string): string {
  if (!value?.trim()) {
    throw new Error(
      `${name} is required when NODE_ENV=production for GIM Pay connectivity`,
    );
  }
  return value.trim();
}

function parseAmountMultiplier(raw?: string): number {
  const parsed = Number(raw?.trim() ?? '100');
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('GIM_AMOUNT_MULTIPLIER must be a positive number');
  }
  return parsed;
}

function parseDateTimeDigitLength(raw?: string): 12 | 15 {
  const value = raw?.trim() ?? '12';
  if (value === '15') {
    return 15;
  }
  if (value === '12') {
    return 12;
  }
  throw new Error('GIM_DATETIME_LOCAL_TRXN_DIGITS must be 12 or 15');
}

function parseBoolean(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === '') {
    return defaultValue;
  }
  const normalized = raw.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

export function loadGimPlatformConfig(): GimPlatformConfig {
  const payByCardUrl =
    process.env.GIM_BASE_URL?.trim() || GIM_UAT_PAY_BY_CARD_URL;
  const merchantId = process.env.GIM_MERCHANT_ID?.trim() ?? '';
  const terminalId = process.env.GIM_TERMINAL_ID?.trim() ?? '';
  const secretKeyHex = process.env.GIM_SECRET_KEY_HEX?.trim() ?? '';
  const returnUrl =
    process.env.GIM_RETURN_URL?.trim() ??
    'https://api.lomi.africa/payments/gim/return';

  if (isStrictProductionGim()) {
    if (
      payByCardUrl.includes('omni-uat.gimpay.org') ||
      payByCardUrl === GIM_UAT_PAY_BY_CARD_URL
    ) {
      throw new Error(
        'GIM_BASE_URL must point to the production GIM Pay API in production (UAT URL is not allowed)',
      );
    }

    return {
      merchantId: requireProductionEnv('GIM_MERCHANT_ID', merchantId),
      terminalId: requireProductionEnv('GIM_TERMINAL_ID', terminalId),
      secretKeyHex: requireProductionEnv('GIM_SECRET_KEY_HEX', secretKeyHex),
      payByCardUrl: requireProductionEnv('GIM_BASE_URL', payByCardUrl),
      returnUrl: requireProductionEnv('GIM_RETURN_URL', returnUrl),
      amountMultiplier: parseAmountMultiplier(
        process.env.GIM_AMOUNT_MULTIPLIER,
      ),
      disable3ds: parseBoolean(process.env.GIM_DISABLE_3DS, false),
      dateTimeLocalTrxnDigitLength: parseDateTimeDigitLength(
        process.env.GIM_DATETIME_LOCAL_TRXN_DIGITS,
      ),
    };
  }

  return {
    merchantId,
    terminalId,
    secretKeyHex,
    payByCardUrl,
    returnUrl,
    amountMultiplier: parseAmountMultiplier(process.env.GIM_AMOUNT_MULTIPLIER),
    disable3ds: parseBoolean(process.env.GIM_DISABLE_3DS, false),
    dateTimeLocalTrxnDigitLength: parseDateTimeDigitLength(
      process.env.GIM_DATETIME_LOCAL_TRXN_DIGITS,
    ),
  };
}

export function assertGimPlatformCredentialsConfigured(
  config: GimPlatformConfig,
): void {
  if (!config.merchantId || !config.terminalId || !config.secretKeyHex) {
    throw new Error(
      'GIM_MERCHANT_ID, GIM_TERMINAL_ID, and GIM_SECRET_KEY_HEX must be configured for GIM Pay API calls',
    );
  }
}
