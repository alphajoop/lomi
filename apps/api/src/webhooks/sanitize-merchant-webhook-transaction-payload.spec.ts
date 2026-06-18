import { sanitizeMerchantWebhookTransactionPayload } from './sanitize-merchant-webhook-transaction-payload';

describe('sanitizeMerchantWebhookTransactionPayload', () => {
  it('preserves payment_flow in transaction metadata', () => {
    const txn = {
      transaction_id: 'txn-1',
      organization_id: 'org-1',
      metadata: {
        payment_flow: 'subscription_renewal',
        order_id: 'ord-1',
      },
    };

    sanitizeMerchantWebhookTransactionPayload(txn);

    expect(txn.metadata.payment_flow).toBe('subscription_renewal');
    expect(txn.metadata.order_id).toBe('ord-1');
  });

  it('still strips internal stripe and wave metadata keys', () => {
    const txn = {
      transaction_id: 'txn-2',
      stripe_payment_intent_id: 'pi_123',
      metadata: {
        payment_flow: 'subscription_renewal_checkout',
        stripe_customer_id: 'cus_123',
        wave_session: { id: 'sess' },
      },
    };

    sanitizeMerchantWebhookTransactionPayload(txn);

    expect(txn.metadata.payment_flow).toBe('subscription_renewal_checkout');
    expect(txn.metadata.stripe_customer_id).toBeUndefined();
    expect(txn.metadata.wave_session).toBeUndefined();
    expect(txn.stripe_payment_intent_id).toBeUndefined();
  });
});
