import {
  callScalar,
  dbDescribe,
  withRollback,
} from './support/client';
import {
  createCustomer,
  createOrgWithAdmin,
  ensureReferenceData,
  getTransaction,
} from './support/seed';

/**
 * POS vs online fee paths on create_transaction (p_is_pos flag).
 */

dbDescribe('POS fees :: create_transaction', () => {
  it('creates successfully with is_pos=true and may use a different fee tier', async () => {
    await withRollback(async (client) => {
      await ensureReferenceData(client);
      const { organizationId, merchantId } = await createOrgWithAdmin(client);
      const customerId = await createCustomer(client, organizationId, {
        environment: 'live',
      });
      const amount = 5000;

      const onlineTxId = await callScalar<string>(
        client,
        'public.create_transaction',
        {
          p_merchant_id: merchantId,
          p_organization_id: organizationId,
          p_customer_id: customerId,
          p_amount: amount,
          p_currency_code: 'XOF',
          p_provider_code: 'WAVE',
          p_payment_method_code: 'MOBILE_MONEY',
          p_description: 'online harness',
          p_product_id: null,
          p_subscription_id: null,
          p_metadata: {},
          p_quantity: 1,
          p_environment: 'live',
          p_price_id: null,
          p_is_pos: false,
        },
      );

      const posTxId = await callScalar<string>(
        client,
        'public.create_transaction',
        {
          p_merchant_id: merchantId,
          p_organization_id: organizationId,
          p_customer_id: customerId,
          p_amount: amount,
          p_currency_code: 'XOF',
          p_provider_code: 'SPI',
          p_payment_method_code: 'BANK_TRANSFER',
          p_description: 'pos harness',
          p_product_id: null,
          p_subscription_id: null,
          p_metadata: { channel: 'mpos' },
          p_quantity: 1,
          p_environment: 'live',
          p_price_id: null,
          p_is_pos: true,
        },
      );

      const online = await getTransaction(client, onlineTxId);
      const pos = await getTransaction(client, posTxId);

      expect(online?.is_pos).toBe(false);
      expect(pos?.is_pos).toBe(true);
      expect(Number(online?.gross_amount)).toBe(amount);
      expect(Number(pos?.gross_amount)).toBe(amount);
      expect(Number(pos?.net_amount)).toBeGreaterThan(0);

      // Fee tiers may match when no POS-specific structure is seeded; the
      // invariant we care about is that both paths produce valid net amounts.
      expect(Number(online?.fee_amount)).toBeGreaterThanOrEqual(0);
      expect(Number(pos?.fee_amount)).toBeGreaterThanOrEqual(0);
    });
  });
});
