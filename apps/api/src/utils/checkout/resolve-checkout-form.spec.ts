import { resolveCheckoutForm } from './resolve-checkout-form';

describe('resolveCheckoutForm', () => {
  it('defaults to email, name, and phone required; billing address hidden', () => {
    const form = resolveCheckoutForm({});

    expect(form.requireEmail).toBe(true);
    expect(form.requirePhone).toBe(true);
    expect(form.requireName).toBe(true);
    expect(form.requireBillingAddress).toBe(false);
    expect(form.showEmail).toBe(true);
    expect(form.showPhone).toBe(true);
    expect(form.showName).toBe(true);
  });

  it('allows phone to be optional when explicitly set off on payment link', () => {
    const form = resolveCheckoutForm({
      paymentLink: {
        require_email: true,
        require_phone: false,
      },
    });

    expect(form.requireEmail).toBe(true);
    expect(form.requirePhone).toBe(false);
    expect(form.showEmail).toBe(true);
    expect(form.showPhone).toBe(true);
  });

  it('hides email and keeps phone required when email is off and phone is on', () => {
    const form = resolveCheckoutForm({
      paymentLink: {
        require_email: false,
        require_phone: true,
      },
    });

    expect(form.requireEmail).toBe(false);
    expect(form.requirePhone).toBe(true);
    expect(form.showEmail).toBe(false);
    expect(form.showPhone).toBe(true);
  });

  it('hides both contact fields when email and phone are off', () => {
    const form = resolveCheckoutForm({
      paymentLink: {
        require_email: false,
        require_phone: false,
      },
    });

    expect(form.requireEmail).toBe(false);
    expect(form.requirePhone).toBe(false);
    expect(form.showEmail).toBe(false);
    expect(form.showPhone).toBe(false);
  });

  it('prefers checkout session flags over payment link', () => {
    const form = resolveCheckoutForm({
      checkoutSession: {
        require_email: false,
        require_phone: true,
      },
      paymentLink: {
        require_email: true,
        require_phone: false,
      },
    });

    expect(form.requireEmail).toBe(false);
    expect(form.requirePhone).toBe(true);
    expect(form.showEmail).toBe(false);
    expect(form.showPhone).toBe(true);
  });

  it('uses payment link flags when session is unset', () => {
    const form = resolveCheckoutForm({
      paymentLink: {
        require_email: true,
        require_phone: true,
      },
    });

    expect(form.requireEmail).toBe(true);
    expect(form.requirePhone).toBe(true);
    expect(form.showEmail).toBe(true);
    expect(form.showPhone).toBe(true);
  });

  it('hides name when require_name is false', () => {
    const form = resolveCheckoutForm({
      checkoutSession: {
        require_name: false,
        require_email: true,
      },
    });

    expect(form.requireName).toBe(false);
    expect(form.showName).toBe(false);
    expect(form.requireEmail).toBe(true);
    expect(form.showEmail).toBe(true);
  });
});
