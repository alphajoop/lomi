import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChargesService } from './charges.service';
import { RadarService } from '../radar/radar.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import type { AuthContext } from '../common/decorators/current-user.decorator';

function networkUser(): AuthContext {
  return {
    apiKey: 'sk_test',
    merchantId: 'operator-merchant',
    actorOrganizationId: 'operator-org',
    targetOrganizationId: 'member-org',
    organizationId: 'member-org',
    environment: 'test',
    isNetworkRequest: true,
    lomiAccount: 'acct_test',
    networkAccountId: 'na-1',
    networkMembershipId: 'nm-1',
    publicAccountId: 'acct_test',
    networkCapabilityKey: 'payment.create',
  };
}

describe('ChargesService (network)', () => {
  let service: ChargesService;
  let rpc: jest.Mock;
  let getClient: jest.Mock;

  beforeEach(() => {
    rpc = jest.fn();
    getClient = jest.fn(() => ({
      rpc,
      functions: {
        invoke: jest.fn().mockResolvedValue({
          data: { transactionId: 'txn-wave-1' },
          error: null,
        }),
      },
    }));

    const supabase = {
      rpc,
      getClient,
    } as unknown as SupabaseService;

    service = new ChargesService(
      {
        get: jest.fn().mockReturnValue('https://lomi.africa'),
      } as unknown as ConfigService,
      supabase,
      {
        evaluateCharge: jest.fn().mockResolvedValue({ action: 'allow' }),
        assertChargeAllowed: jest.fn().mockResolvedValue(undefined),
      } as unknown as RadarService,
    );
  });

  it('uses fetch_network_provider_settings_for_api for delegated Wave charges', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: { transactionId: 'txn-wave-1' },
      error: null,
    });

    rpc.mockImplementation(async (name: string) => {
      if (name === 'lookup_api_idempotency_record') {
        return { data: null, error: null };
      }
      if (name === 'create_or_update_customer') {
        return { data: 'cust-1', error: null };
      }
      if (name === 'resolve_network_member_merchant_id') {
        return { data: 'member-merchant-1', error: null };
      }
      if (name === 'fetch_network_provider_settings_for_api') {
        return {
          data: [{ provider_merchant_id: 'wave-agg-1' }],
          error: null,
        };
      }
      if (name === 'record_network_transaction_context') {
        return { data: 'ctx-1', error: null };
      }
      if (name === 'calculate_network_operator_fee') {
        return { data: 0, error: null };
      }
      return { data: null, error: null };
    });

    const from = jest.fn((table: string) => {
      if (table === 'network_memberships') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { accepted_by_merchant_id: 'member-merchant-1' },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { operator_fee_rule_id: null },
          error: null,
        }),
      };
    });

    getClient.mockReturnValue({ rpc, from, functions: { invoke } });

    await service.createWaveCharge(
      {
        amount: 1000,
        currency: 'XOF',
        organizationId: 'member-org',
        merchantId: 'operator-merchant',
        customer: {
          name: 'Jane',
          email: 'jane@example.com',
          phoneNumber: '+2250700000000',
        },
      },
      networkUser(),
    );

    expect(rpc).toHaveBeenCalledWith(
      'fetch_network_provider_settings_for_api',
      expect.objectContaining({
        p_network_membership_id: 'nm-1',
        p_provider_code: 'WAVE',
      }),
    );
    expect(invoke).toHaveBeenCalled();
  });

  it('rejects Wave charge when network provider is not connected', async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === 'resolve_network_member_merchant_id') {
        return { data: 'member-merchant-1', error: null };
      }
      if (name === 'create_or_update_customer') {
        return { data: 'cust-1', error: null };
      }
      if (name === 'fetch_network_provider_settings_for_api') {
        return { data: [], error: null };
      }
      return { data: null, error: null };
    });

    getClient.mockReturnValue({
      rpc,
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { accepted_by_merchant_id: 'member-merchant-1' },
          error: null,
        }),
      })),
      functions: { invoke: jest.fn() },
    });

    await expect(
      service.createWaveCharge(
        {
          amount: 1000,
          currency: 'XOF',
          organizationId: 'member-org',
          merchantId: 'operator-merchant',
          customer: {
            name: 'Jane',
            email: 'jane@example.com',
            phoneNumber: '+2250700000000',
          },
        },
        networkUser(),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
