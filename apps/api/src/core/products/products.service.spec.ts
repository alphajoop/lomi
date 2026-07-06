import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('ProductsService', () => {
  let service: ProductsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('calls fetch_products with merchant scope', async () => {
    mock.rpc.mockResolvedValue({ data: [{ product_id: 'prod-1' }], error: null });

    const result = await service.findAll(user, true, 10, 0);

    expect(result).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_products',
      expect.objectContaining({
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_is_active: true,
        p_limit: 10,
        p_offset: 0,
        p_environment: 'live',
      }),
    );
  });

  it('throws NotFoundException when product is missing', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('propagates RPC errors from findAll', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'products failed' } });

    await expect(service.findAll(user)).rejects.toThrow('products failed');
  });
});
