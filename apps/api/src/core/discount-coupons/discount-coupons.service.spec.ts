import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DiscountCouponsService } from './discount-coupons.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('DiscountCouponsService', () => {
  let service: DiscountCouponsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountCouponsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(DiscountCouponsService);
  });

  it('calls get_organization_coupons with organization and environment', async () => {
    mock.rpc.mockResolvedValue({ data: [{ coupon_id: 'c-1' }], error: null });

    const result = await service.findAll(user);

    expect(result).toEqual([{ coupon_id: 'c-1' }]);
    expect(mock.rpc).toHaveBeenCalledWith(
      'get_organization_coupons',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_environment: 'live',
      }),
    );
  });

  it('throws NotFoundException when coupon is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects percentage coupons without discount_percentage', async () => {
    await expect(
      service.create(
        {
          code: 'SAVE10',
          discount_type: 'percentage',
        } as never,
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
