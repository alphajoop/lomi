import {
  mapSpiEventToPaymentStatus,
  mapSpiWebhookEventToWebhookEvent,
  normalizeUemoaCountryCode,
  toProviderAmount,
} from './spi.utils';

describe('spi.utils', () => {
  it('normalizes UEMOA country codes with fallback', () => {
    expect(normalizeUemoaCountryCode('ci')).toBe('CI');
    expect(normalizeUemoaCountryCode('XX')).toBe('SN');
  });

  it('converts base amounts to provider centimes', () => {
    expect(toProviderAmount(1500)).toBe(150000);
  });

  it('maps SPI webhook events to merchant webhook events', () => {
    expect(mapSpiWebhookEventToWebhookEvent('PAIEMENT_RECU')).toBe(
      'PAYMENT_SUCCEEDED',
    );
    expect(mapSpiWebhookEventToWebhookEvent('PAIEMENT_REJETE')).toBe(
      'PAYMENT_FAILED',
    );
  });

  it('maps SPI events to payment status', () => {
    expect(mapSpiEventToPaymentStatus('PAIEMENT_RECU')).toBe('IRREVOCABLE');
    expect(mapSpiEventToPaymentStatus('PAIEMENT_REJETE')).toBe('REJETE');
  });
});
