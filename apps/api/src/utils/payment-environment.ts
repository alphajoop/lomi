export type LomiPaymentEnvironment = 'live' | 'test';

/** Normalize DB / API / payload values to ledger environment (default live). */
export function normalizePaymentEnvironment(
  value: unknown,
): LomiPaymentEnvironment {
  return typeof value === 'string' && value.toLowerCase().trim() === 'test'
    ? 'test'
    : 'live';
}

/** Pick merchant webhook URLs from outbound transaction/event payload. */
export function resolveMerchantWebhookRelayEnvironment(
  data: unknown,
): LomiPaymentEnvironment {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if ('environment' in obj) {
      return normalizePaymentEnvironment(obj.environment);
    }
    const metadata = obj.metadata;
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      const meta = metadata as Record<string, unknown>;
      if (meta.payment_environment != null) {
        return normalizePaymentEnvironment(meta.payment_environment);
      }
      if (meta.test_mode === true) {
        return 'test';
      }
    }
  }
  return 'live';
}
