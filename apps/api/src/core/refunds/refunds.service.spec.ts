import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import type { AuthContext } from '../common/decorators/current-user.decorator';

const stripeRefundsCreate = jest.fn();

jest.mock('../../utils/stripe/stripe-keys', () => ({
  resolveStripeSecretKey: jest.fn(() => 'sk_test_mock'),
  createStripeClient: jest.fn(() => ({
    refunds: { create: stripeRefundsCreate },
  })),
}));

describe('RefundsService', () => {
  const user: AuthContext = {
    merchantId: '904d003c-3736-41d4-90a5-9de74d404fd7',
    organizationId: '0979ec77-9fb1-4c9a-8c55-d7fb6c182c9c',
    environment: 'live',
  };

  const completedCardTx = {
    transaction_id: 'tx-card',
    organization_id: user.organizationId,
    customer_id: 'cust-1',
    gross_amount: 10000,
    net_amount: 9500,
    fee_amount: 500,
    currency_code: 'XOF',
    provider_code: 'STRIPE',
    payment_method_code: 'CARDS',
    status: 'completed',
    metadata: { stripe_amount_cents: 1520, stripe_charge_id: 'ch_test' },
    environment: 'test',
  };

  const completedWaveTx = {
    transaction_id: 'tx-wave',
    organization_id: user.organizationId,
    customer_id: 'cust-1',
    gross_amount: 10000,
    net_amount: 9500,
    fee_amount: 500,
    currency_code: 'XOF',
    provider_code: 'WAVE',
    payment_method_code: 'MOBILE_MONEY',
    status: 'completed',
  };

  const completedMtnTx = {
    transaction_id: 'tx-mtn',
    organization_id: user.organizationId,
    customer_id: 'cust-1',
    gross_amount: 10000,
    net_amount: 9500,
    fee_amount: 500,
    currency_code: 'XOF',
    provider_code: 'MTN',
    payment_method_code: 'MOBILE_MONEY',
    status: 'completed',
    environment: 'live',
  };

  const completedMtnTestTx = {
    ...completedMtnTx,
    transaction_id: 'tx-mtn-test',
    environment: 'test',
  };

  const networkUser: AuthContext = {
    ...user,
    isNetworkRequest: true,
    actorOrganizationId: '11111111-1111-4111-8111-111111111111',
    targetOrganizationId: user.organizationId,
    lomiAccount: 'acct_member',
    networkAccountId: '22222222-2222-4222-8222-222222222222',
    networkMembershipId: '33333333-3333-4333-8333-333333333333',
    publicAccountId: 'acct_member',
    networkCapabilityKey: 'transaction.read_own',
  };

  function buildService(
    rpcImpl: (name: string, args: Record<string, unknown>) => unknown,
    providerChargeId = 'ch_test',
  ) {
    const rpc = jest.fn((name: string, args: Record<string, unknown>) =>
      Promise.resolve(rpcImpl(name, args)),
    );
    const createQueryChain = (table?: string) => {
      const chain = {
        eq: jest.fn(function eq() {
          return chain;
        }),
        limit: jest.fn(() =>
          Promise.resolve({
            data: [{ provider_transaction_id: providerChargeId }],
            error: null,
          }),
        ),
        maybeSingle: jest.fn(() => {
          if (table === 'network_memberships') {
            return Promise.resolve({
              data: {
                accepted_by_merchant_id: 'member-merchant-1',
                operator_fee_rule_id: null,
              },
              error: null,
            });
          }
          if (table === 'network_operator_fee_entries') {
            return Promise.resolve({
              data: { amount: 25, currency_code: 'XOF' },
              error: null,
            });
          }
          return Promise.resolve({
            data: { provider_transaction_id: providerChargeId },
            error: null,
          });
        }),
      };
      return chain;
    };
    const from = jest.fn((table?: string) => ({
      select: jest.fn(() => createQueryChain(table)),
    }));
    const client = { rpc, from };
    const supabaseService = {
      getClient: () => client,
    };
    const configService = {
      get: (key: string) => {
        if (key === 'SUPABASE_PROJECT_REF') return 'proj';
        if (key === 'STRIPE_REFUND_FALLBACK_MANUAL') return 'false';
        return 'anon-key';
      },
    };
    const originalFetch = global.fetch;
    global.fetch = jest.fn();

    return {
      service: new RefundsService(
        configService as never,
        supabaseService as never,
      ),
      rpc,
      restore: () => {
        global.fetch = originalFetch;
      },
    };
  }

  afterEach(() => {
    jest.restoreAllMocks();
    stripeRefundsCreate.mockReset();
  });

  it('rejects unsupported provider', async () => {
    const { service, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return {
          data: [
            {
              ...completedCardTx,
              provider_code: 'ORANGE',
              payment_method_code: 'MOBILE_MONEY',
            },
          ],
          error: null,
        };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      return { data: null, error: null };
    });

    await expect(
      service.create({ transaction_id: 'tx-card', amount: 1000 }, user),
    ).rejects.toThrow(BadRequestException);

    restore();
  });

  it('creates card refund via Stripe + create_stripe_card_refund_api', async () => {
    stripeRefundsCreate.mockResolvedValue({ id: 're_test_1' });

    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedCardTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_stripe_card_refund_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-1',
            refunded_amount: 10000,
            status: 'completed',
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await service.create(
      { transaction_id: 'tx-card', amount: 10000, refund_type: 'full' },
      user,
    );

    expect(result.refund_id).toBe('ref-1');
    expect(stripeRefundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ charge: 'ch_test' }),
    );
    expect(rpc).toHaveBeenCalledWith(
      'create_stripe_card_refund_api',
      expect.objectContaining({
        p_merchant_id: user.merchantId,
        p_transaction_id: 'tx-card',
        p_stripe_refund_id: 're_test_1',
        p_subscription_action: 'default',
      }),
    );

    restore();
  });

  it('maps Stripe charge_disputed to BadRequestException', async () => {
    stripeRefundsCreate.mockRejectedValue({
      code: 'charge_disputed',
      message: 'Charge ch_test has been charged back',
    });

    const { service, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedCardTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      return { data: null, error: null };
    });

    await expect(
      service.create(
        { transaction_id: 'tx-card', amount: 10000, refund_type: 'full' },
        user,
      ),
    ).rejects.toThrow(BadRequestException);

    restore();
  });

  it('forwards explicit subscription_action none to card refund RPC', async () => {
    stripeRefundsCreate.mockResolvedValue({ id: 're_test_2' });

    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedCardTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_stripe_card_refund_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-1',
            refunded_amount: 10000,
            status: 'completed',
            subscription_action: { applied: false, action: 'none' },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await service.create(
      {
        transaction_id: 'tx-card',
        amount: 10000,
        refund_type: 'full',
        subscription_action: 'none',
      },
      user,
    );

    expect(result.subscription_action).toEqual({
      applied: false,
      action: 'none',
    });
    expect(rpc).toHaveBeenCalledWith(
      'create_stripe_card_refund_api',
      expect.objectContaining({
        p_subscription_action: 'none',
      }),
    );

    restore();
  });

  it('creates Wave full refund via ledger RPC then edge with refundId', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedWaveTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_wave_refund_request_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-wave-full',
            status: 'completed',
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, refundId: 'wave-ref-1' }),
    });

    const result = await service.create(
      { transaction_id: 'tx-wave', amount: 10000, refund_type: 'full' },
      user,
    );

    expect(result.refund_id).toBe('ref-wave-full');
    expect(rpc).toHaveBeenCalledWith(
      'create_wave_refund_request_api',
      expect.objectContaining({
        p_transaction_id: 'tx-wave',
        p_refund_amount: 10000,
      }),
    );

    const fetchBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(fetchBody.path).toBe('/refund');
    expect(fetchBody.body.refundId).toBe('ref-wave-full');

    restore();
  });

  it('rolls back Wave full refund when edge call fails', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedWaveTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_wave_refund_request_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-wave-full',
            status: 'completed',
          },
          error: null,
        };
      }
      if (name === 'rollback_wave_refund') {
        return {
          data: { success: true, refund_id: 'ref-wave-full' },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'Wave error',
    });

    await expect(
      service.create(
        { transaction_id: 'tx-wave', amount: 10000, refund_type: 'full' },
        user,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(rpc).toHaveBeenCalledWith(
      'rollback_wave_refund',
      expect.objectContaining({ p_refund_id: 'ref-wave-full' }),
    );

    restore();
  });

  it('creates Wave partial refund via payout then create_refund only', async () => {
    const { service, rpc, restore } = buildService((name, _args) => {
      if (name === 'get_transaction') {
        return { data: [completedWaveTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'get_customer') {
        return {
          data: [{ name: 'Alice', phone_number: '+221771234567' }],
          error: null,
        };
      }
      if (name === 'create_refund') {
        return { data: 'ref-partial', error: null };
      }
      if (name === 'apply_wave_partial_refund_charges') {
        return { data: [{ success: true, error_message: null }], error: null };
      }
      if (name === 'update_organization_balance_for_refund') {
        throw new Error('partial refunds must not debit balance twice');
      }
      return { data: null, error: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        payoutId: 'payout-1',
        wavePayoutId: 'wave-payout-1',
        totalDeduction: 5100,
      }),
    });

    const result = await service.create(
      {
        transaction_id: 'tx-wave',
        amount: 5000,
        refund_type: 'partial',
      },
      user,
    );

    expect(result.refund_id).toBe('ref-partial');
    expect(rpc).toHaveBeenCalledWith(
      'create_refund',
      expect.objectContaining({
        p_transaction_id: 'tx-wave',
        p_amount: 5000,
        p_metadata: expect.objectContaining({ balance_via_payout: true }),
      }),
    );
    expect(rpc).toHaveBeenCalledWith(
      'apply_wave_partial_refund_charges',
      expect.objectContaining({
        p_transaction_id: 'tx-wave',
        p_refund_id: 'ref-partial',
      }),
    );
    expect(rpc).not.toHaveBeenCalledWith(
      'update_organization_balance_for_refund',
      expect.anything(),
    );

    restore();
  });

  it('creates MTN full refund via ledger RPC then mtn edge with refundId', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedMtnTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_mtn_refund_request_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-mtn-full',
            status: 'completed',
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, refundReferenceId: 'mtn-ref-1' }),
    });

    const result = await service.create(
      { transaction_id: 'tx-mtn', amount: 10000, refund_type: 'full' },
      user,
    );

    expect(result.refund_id).toBe('ref-mtn-full');
    expect(rpc).toHaveBeenCalledWith(
      'create_mtn_refund_request_api',
      expect.objectContaining({
        p_transaction_id: 'tx-mtn',
        p_refund_amount: 10000,
      }),
    );

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/functions/v1/mtn');
    const fetchBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(fetchBody.path).toBe('/refund');
    expect(fetchBody.body.refundId).toBe('ref-mtn-full');

    restore();
  });

  it('skips MTN edge for test-environment transactions', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedMtnTestTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_mtn_refund_request_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-mtn-test',
            status: 'completed',
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await service.create(
      { transaction_id: 'tx-mtn-test', amount: 10000, refund_type: 'full' },
      user,
    );

    expect(result.refund_id).toBe('ref-mtn-test');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      'create_mtn_refund_request_api',
      expect.objectContaining({ p_transaction_id: 'tx-mtn-test' }),
    );

    restore();
  });

  it('rolls back MTN full refund when edge call fails', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedMtnTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_mtn_refund_request_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-mtn-full',
            status: 'completed',
          },
          error: null,
        };
      }
      if (name === 'rollback_mtn_refund') {
        return {
          data: { success: true, refund_id: 'ref-mtn-full' },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'MTN error',
    });

    await expect(
      service.create(
        { transaction_id: 'tx-mtn', amount: 10000, refund_type: 'full' },
        user,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(rpc).toHaveBeenCalledWith(
      'rollback_mtn_refund',
      expect.objectContaining({ p_refund_id: 'ref-mtn-full' }),
    );

    restore();
  });

  it('creates MTN partial refund via ledger then edge and apply_mtn_partial_refund_charges', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedMtnTx], error: null };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'get_customer') {
        return {
          data: [{ name: 'Alice', phone_number: '+225071234567' }],
          error: null,
        };
      }
      if (name === 'create_mtn_refund_request_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-mtn-partial',
            status: 'completed',
          },
          error: null,
        };
      }
      if (name === 'apply_mtn_partial_refund_charges') {
        return { data: [{ success: true, error_message: null }], error: null };
      }
      return { data: null, error: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        refundReferenceId: 'mtn-ref-partial',
      }),
    });

    const result = await service.create(
      {
        transaction_id: 'tx-mtn',
        amount: 5000,
        refund_type: 'partial',
      },
      user,
    );

    expect(result.refund_id).toBe('ref-mtn-partial');
    expect(rpc).toHaveBeenCalledWith(
      'create_mtn_refund_request_api',
      expect.objectContaining({
        p_transaction_id: 'tx-mtn',
        p_refund_amount: 5000,
        p_subscription_action: 'none',
      }),
    );
    expect(rpc).toHaveBeenCalledWith(
      'apply_mtn_partial_refund_charges',
      expect.objectContaining({
        p_transaction_id: 'tx-mtn',
        p_refund_id: 'ref-mtn-partial',
      }),
    );

    restore();
  });

  it('findOne throws when refund missing', async () => {
    const { service, restore } = buildService((name) => {
      if (name === 'get_refund') {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );

    restore();
  });

  it('lists Network refunds through the Network-scoped RPC', async () => {
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'fetch_network_refunds_for_api') {
        return {
          data: [{ refund_id: 'ref-network', transaction_id: 'tx-network' }],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await service.findAll(
      networkUser,
      'completed',
      undefined,
      undefined,
      25,
      5,
    );

    expect(result.data).toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith(
      'fetch_network_refunds_for_api',
      expect.objectContaining({
        p_network_membership_id: networkUser.networkMembershipId,
        p_status: 'completed',
        p_limit: 25,
        p_offset: 5,
        p_read_scope: 'own',
      }),
    );

    restore();
  });

  it('gets a Network refund with all scope when transaction.read is granted', async () => {
    const allScopeUser = {
      ...networkUser,
      networkCapabilityKey: 'transaction.read',
    };
    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_network_refund_for_api') {
        return {
          data: [{ refund_id: 'ref-network', transaction_id: 'tx-network' }],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const result = await service.findOne('ref-network', allScopeUser);

    expect((result.data as { refund_id: string }).refund_id).toBe(
      'ref-network',
    );
    expect(rpc).toHaveBeenCalledWith(
      'get_network_refund_for_api',
      expect.objectContaining({
        p_network_membership_id: networkUser.networkMembershipId,
        p_refund_id: 'ref-network',
        p_read_scope: 'all',
      }),
    );

    restore();
  });

  it('records network context and fee reversal after a delegated card refund', async () => {
    stripeRefundsCreate.mockResolvedValue({ id: 're_network' });

    const { service, rpc, restore } = buildService((name) => {
      if (name === 'get_transaction') {
        return { data: [completedCardTx], error: null };
      }
      if (name === 'get_network_transaction_for_api') {
        return {
          data: [{ transaction_id: 'tx-card' }],
          error: null,
        };
      }
      if (name.startsWith('get_effective_other_fee_config')) {
        return { data: [{ percentage: 2, fixed_amount: 0 }], error: null };
      }
      if (name === 'create_stripe_card_refund_api') {
        return {
          data: {
            success: true,
            refund_id: 'ref-network',
            refunded_amount: 10000,
            status: 'completed',
          },
          error: null,
        };
      }
      if (name === 'record_network_transaction_context') {
        return { data: 'ctx-network', error: null };
      }
      if (name === 'record_network_operator_fee_reversal') {
        return { data: 'fee-reversal-network', error: null };
      }
      if (name === 'enqueue_network_webhook_event') {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const result = await service.create(
      { transaction_id: 'tx-card', amount: 10000, refund_type: 'full' },
      networkUser,
    );

    expect(result.refund_id).toBe('ref-network');
    expect(rpc).toHaveBeenCalledWith(
      'record_network_transaction_context',
      expect.objectContaining({
        p_network_membership_id: networkUser.networkMembershipId,
        p_refund_id: 'ref-network',
        p_capability_key: 'refund.create',
      }),
    );
    expect(rpc).toHaveBeenCalledWith(
      'record_network_operator_fee_reversal',
      expect.objectContaining({
        p_refund_id: 'ref-network',
        p_transaction_id: 'tx-card',
      }),
    );

    restore();
  });
});
