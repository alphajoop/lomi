import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('CustomersService', () => {
  let service: CustomersService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(CustomersService);
  });

  it('calls fetch_customers_with_status with merchant and organization', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ customer_id: 'cust-1', total_count: 1, name: 'Ada' }],
      error: null,
    });

    const result = await service.findAll(user);

    expect(result.customers).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_customers_with_status',
      expect.objectContaining({
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_environment: 'live',
      }),
    );
  });

  it('throws NotFoundException when customer is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('propagates RPC errors from findAll', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'list failed' } });

    await expect(service.findAll(user)).rejects.toThrow('list failed');
  });
});
