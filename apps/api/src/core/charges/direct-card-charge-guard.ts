import { ServiceUnavailableException } from '@nestjs/common';

const ENABLED_VALUES = new Set(['1', 'true', 'yes']);

function isDirectChargeFeatureEnabled(envName: string): boolean {
  const raw = process.env[envName]?.trim().toLowerCase();
  return raw !== undefined && ENABLED_VALUES.has(raw);
}

/** Embedded card charges (`POST /charge/card`) are gated until rails are production-ready. */
export function assertDirectCardChargesAvailable(): void {
  if (isDirectChargeFeatureEnabled('LOMI_DIRECT_CARD_CHARGES_ENABLED')) {
    return;
  }
  throw new ServiceUnavailableException(
    'Card payments are temporarily unavailable. Please use another payment method or try again later.',
  );
}

/** Switch server-side card charges (`POST /charge/switch`) are gated alongside embedded card. */
export function assertDirectSwitchChargesAvailable(): void {
  if (isDirectChargeFeatureEnabled('LOMI_DIRECT_SWITCH_CHARGES_ENABLED')) {
    return;
  }
  throw new ServiceUnavailableException(
    'Switch card payments are temporarily unavailable. Please use hosted checkout or another payment method.',
  );
}
