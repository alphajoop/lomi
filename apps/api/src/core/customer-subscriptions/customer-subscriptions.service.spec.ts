import { Test, TestingModule } from '@nestjs/testing';
import { CustomerSubscriptionsService } from './customer-subscriptions.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('CustomerSubscriptionsService', () => {
  let service: CustomerSubscriptionsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;
  const subscriptionsService = {
    findOne: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerSubscriptionsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        {
          provide: SubscriptionsService,
          useValue: subscriptionsService,
        },
      ],
    }).compile();
    service = module.get(CustomerSubscriptionsService);
  });

  it('calls list_customer_subscriptions with merchant scope', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ subscription_id: 'sub-1' }],
      error: null,
    });

    const result = await service.findAll(user, 'cust-1', 'active', 10, 5);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'list_customer_subscriptions',
      expect.objectContaining({
        p_merchant_id: user.merchantId,
        p_customer_id: 'cust-1',
        p_status: 'active',
        p_limit: 10,
        p_offset: 5,
      }),
    );
  });

  it('propagates RPC errors from findAll', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'list failed' },
    });

    await expect(service.findAll(user)).rejects.toThrow('list failed');
  });

  it('delegates findOne to SubscriptionsService', async () => {
    subscriptionsService.findOne.mockResolvedValue({
      subscription_id: 'sub-1',
    });

    const result = await service.findOne('sub-1', user);

    expect(result).toEqual({
      success: true,
      data: { subscription_id: 'sub-1' },
    });
    expect(subscriptionsService.findOne).toHaveBeenCalledWith('sub-1', user);
  });
});
