import {
  resolveCardCurrency,
  resolveRequestedCurrency,
  type OrganizationPaymentParameters,
} from './resolve-payment-parameters';

const baseParams: OrganizationPaymentParameters = {
  default_currency: 'XOF',
  allowed_currencies: ['XOF', 'USD', 'EUR'],
  default_card_currency: 'EUR',
  require_email: true,
  require_phone: true,
  require_name: true,
  require_billing_address: false,
  default_success_url: '',
  default_cancel_url: '',
  display_coupon_field: true,
  appearance_theme: 'stripe',
  appearance_border_radius: '4px',
  appearance_billing_address: 'auto',
};

describe('resolveRequestedCurrency', () => {
  it('falls back to organization default when omitted', () => {
    expect(resolveRequestedCurrency(undefined, baseParams)).toBe('XOF');
  });

  it('rejects currencies outside allowed list', () => {
    expect(() =>
      resolveRequestedCurrency('USD', {
        ...baseParams,
        allowed_currencies: ['XOF'],
      }),
    ).toThrow("Currency 'USD' is not allowed");
  });
});

describe('resolveCardCurrency', () => {
  it('uses default_card_currency when request omits currency', () => {
    expect(resolveCardCurrency(undefined, undefined, baseParams)).toBe('EUR');
  });

  it('prefers explicit currency_code over alias', () => {
    expect(resolveCardCurrency('USD', 'XOF', baseParams)).toBe('USD');
  });
});
