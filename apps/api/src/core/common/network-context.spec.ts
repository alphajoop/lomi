import {
  assertNetworkContextRecorded,
  buildNetworkCustomerMetadata,
  buildNetworkProviderMetadata,
  isNetworkRequest,
  namespaceNetworkIdempotency,
  recordNetworkContext,
  recordNetworkOperatorFeeReversal,
} from './network-context';
import { InternalServerErrorException } from '@nestjs/common';
import type { AuthContext } from './decorators/current-user.decorator';
import type { SupabaseService } from '../../utils/supabase/supabase.service';

function networkUser(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    apiKey: 'sk_test_key',
    merchantId: 'merchant-1',
    actorOrganizationId: 'operator-org',
    targetOrganizationId: 'member-org',
    organizationId: 'operator-org',
    environment: 'test',
    isNetworkRequest: true,
    lomiAccount: 'acct_test123',
    networkAccountId: 'na-1',
    networkMembershipId: 'nm-1',
    publicAccountId: 'acct_test123',
    networkCapabilityKey: 'payment.create',
    ...overrides,
  };
}

describe('network-context', () => {
  it('detects network requests from auth context', () => {
    expect(isNetworkRequest(networkUser())).toBe(true);
    expect(isNetworkRequest(networkUser({ isNetworkRequest: false }))).toBe(
      false,
    );
  });

  it('namespaces idempotency keys per membership and account', () => {
    const namespaced = namespaceNetworkIdempotency(networkUser(), {
      key: 'checkout-1',
      bodyHash: 'body-hash',
    });

    expect(namespaced?.key).toContain('network:nm-1:');
    expect(namespaced?.bodyHash).not.toBe('body-hash');
  });

  it('builds provider and customer metadata for delegated requests', () => {
    const user = networkUser();
    expect(buildNetworkProviderMetadata(user)).toMatchObject({
      lomi_network_request: 'true',
      public_account_id: 'acct_test123',
    });
    expect(buildNetworkCustomerMetadata(user)).toMatchObject({
      network: {
        operator_organization_id: 'operator-org',
        member_organization_id: 'member-org',
      },
    });
  });

  it('enqueues fee reversal webhook after RPC succeeds', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValueOnce({ data: 'fee-reversal-1', error: null })
      .mockResolvedValueOnce({
        data: { amount: 25, currency_code: 'XOF' },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { amount: 25, currency_code: 'XOF' },
        error: null,
      }),
    }));

    const supabase = {
      getClient: () => ({ rpc, from }),
    } as unknown as SupabaseService;

    const result = await recordNetworkOperatorFeeReversal(supabase, networkUser(), {
      refundId: 'refund-1',
      transactionId: 'txn-1',
      refundAmount: 1000,
    });

    expect(result).toBe('fee-reversal-1');
    expect(rpc).toHaveBeenCalledWith(
      'enqueue_network_webhook_event',
      expect.objectContaining({
        p_event: 'NETWORK_OPERATOR_FEE_REVERSED',
        p_idempotency_key: 'network_operator_fee_reversed_fee-reversal-1',
      }),
    );
  });

  it('enqueues payment webhook when enqueuePaymentCreated is set explicitly', async () => {
    const rpc = jest.fn(async (name: string) => {
      if (name === 'record_network_transaction_context') {
        return { data: 'ctx-1', error: null };
      }
      if (name === 'calculate_network_operator_fee') {
        return { data: 50, error: null };
      }
      if (name === 'record_network_operator_fee_entry') {
        return { data: 'fee-entry-1', error: null };
      }
      if (name === 'enqueue_network_webhook_event') {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    const from = jest.fn((table: string) => {
      if (table === 'network_memberships') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { operator_fee_rule_id: 'rule-1' },
            error: null,
          }),
        };
      }
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { name: 'Member Org' },
            error: null,
          }),
        };
      }
      if (table === 'transactions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { customer_id: 'cust-1' },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const supabase = {
      getClient: () => ({ rpc, from }),
    } as unknown as SupabaseService;

    const result = await recordNetworkContext(supabase, networkUser(), {
      transactionId: 'txn-1',
      checkoutSessionId: 'cs-1',
      amount: 1000,
      currencyCode: 'XOF',
      capabilityKey: 'payment.create',
      enqueuePaymentCreated: true,
      paymentEventIdempotencyKey: 'payment-event-1',
    });

    expect(result?.feeEntryId).toBe('fee-entry-1');
    expect(rpc).toHaveBeenCalledWith(
      'enqueue_network_webhook_event',
      expect.objectContaining({
        p_event: 'NETWORK_PAYMENT_CREATED',
        p_idempotency_key: 'payment-event-1',
        p_payload: expect.objectContaining({
          member_organization_name: 'Member Org',
          customer_id: 'cust-1',
        }),
      }),
    );
    expect(rpc).not.toHaveBeenCalledWith(
      'enqueue_network_webhook_event',
      expect.objectContaining({
        p_event: 'NETWORK_OPERATOR_FEE_CREATED',
      }),
    );
  });

  it('throws when network context recording is required but failed', () => {
    expect(() =>
      assertNetworkContextRecorded(networkUser(), null, 'card charge'),
    ).toThrow(InternalServerErrorException);
    expect(() =>
      assertNetworkContextRecorded(
        networkUser({ isNetworkRequest: false }),
        null,
        'card charge',
      ),
    ).not.toThrow();
  });

  it('skips network context recording for non-network users', async () => {
    const rpc = jest.fn();
    const supabase = {
      getClient: () => ({ rpc }),
    } as unknown as SupabaseService;

    const result = await recordNetworkContext(
      supabase,
      networkUser({ isNetworkRequest: false, networkMembershipId: undefined }),
      {
        transactionId: 'txn-1',
        capabilityKey: 'payment.create',
      },
    );

    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });
});
