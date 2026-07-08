import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(SubscriptionsService);
  });

  it('calls fetch_subscriptions with organization and environment', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ subscription_id: 'sub-1' }],
      error: null,
    });

    const result = await service.findAll(user, 2, 25);

    expect(result).toEqual([{ subscription_id: 'sub-1' }]);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_subscriptions',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_merchant_id: user.merchantId,
        p_page: 2,
        p_page_size: 25,
        p_environment: 'live',
      }),
    );
  });

  it('calls list_customer_subscriptions when customer_id or status filter is set', async () => {
    mock.rpc.mockResolvedValue({
      data: [
        {
          subscription_id: 'sub-2',
          product_id: 'prod-1',
          plan_name: 'Pro',
          customer_id: 'cust-1',
          customer_name: 'Jane',
          status: 'active',
          plan_amount: 5000,
          plan_currency_code: 'XOF',
        },
      ],
      error: null,
    });

    const result = await service.findAll(user, 1, 20, 'cust-1', 'active');

    expect(result).toEqual([
      expect.objectContaining({
        subscription_id: 'sub-2',
        product_name: 'Pro',
        customer_id: 'cust-1',
        amount: 5000,
        currency_code: 'XOF',
      }),
    ]);
    expect(mock.rpc).toHaveBeenCalledWith(
      'list_customer_subscriptions',
      expect.objectContaining({
        p_merchant_id: user.merchantId,
        p_customer_id: 'cust-1',
        p_status: 'active',
        p_limit: 20,
        p_offset: 0,
      }),
    );
  });

  it('throws when RPC returns an error', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'db down' } });

    await expect(service.findAll(user)).rejects.toThrow('db down');
  });

  it('throws NotFoundException when subscription is missing', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });
});
