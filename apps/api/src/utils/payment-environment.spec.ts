import {
  normalizePaymentEnvironment,
  resolveMerchantWebhookRelayEnvironment,
} from './payment-environment';

describe('payment-environment', () => {
  it('normalizePaymentEnvironment defaults to live', () => {
    expect(normalizePaymentEnvironment(undefined)).toBe('live');
    expect(normalizePaymentEnvironment('TEST')).toBe('test');
    expect(normalizePaymentEnvironment(' live ')).toBe('live');
  });

  it('resolveMerchantWebhookRelayEnvironment reads payload environment', () => {
    expect(
      resolveMerchantWebhookRelayEnvironment({ environment: 'test' }),
    ).toBe('test');
    expect(
      resolveMerchantWebhookRelayEnvironment({ environment: 'TEST' }),
    ).toBe('test');
    expect(resolveMerchantWebhookRelayEnvironment({ id: 'tx_1' })).toBe('live');
    expect(
      resolveMerchantWebhookRelayEnvironment({
        metadata: { payment_environment: 'test' },
      }),
    ).toBe('test');
    expect(
      resolveMerchantWebhookRelayEnvironment({
        metadata: { test_mode: true },
      }),
    ).toBe('test');
  });
});
