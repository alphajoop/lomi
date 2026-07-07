import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsageCreditsService } from './usage-credits.service';
import { MetersService } from './meters.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('UsageCreditsService', () => {
  let service: UsageCreditsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;
  const metersService = { findOne: jest.fn() };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageCreditsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        { provide: MetersService, useValue: metersService },
      ],
    }).compile();
    service = module.get(UsageCreditsService);
  });

  it('credits wallet after validating meter ownership', async () => {
    metersService.findOne.mockResolvedValue({ meter_id: 'meter-1' });
    mock.rpc.mockResolvedValue({ data: { credited: 100 }, error: null });

    const result = await service.credit(user, {
      meter_id: 'meter-1',
      customer_id: 'cust-1',
      units: 100,
    });

    expect(result).toEqual({ credited: 100 });
    expect(metersService.findOne).toHaveBeenCalledWith('meter-1', user);
    expect(mock.rpc).toHaveBeenCalledWith(
      'credit_usage_wallet',
      expect.objectContaining({
        p_meter_id: 'meter-1',
        p_customer_id: 'cust-1',
        p_units: 100,
        p_reason: 'top_up',
      }),
    );
  });

  it('propagates meter not-found before crediting', async () => {
    metersService.findOne.mockRejectedValue(new NotFoundException('missing'));

    await expect(
      service.credit(user, {
        meter_id: 'missing',
        customer_id: 'cust-1',
        units: 10,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mock.rpc).not.toHaveBeenCalled();
  });

  it('propagates credit_usage_wallet RPC errors', async () => {
    metersService.findOne.mockResolvedValue({ meter_id: 'meter-1' });
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'credit failed' },
    });

    await expect(
      service.credit(user, {
        meter_id: 'meter-1',
        customer_id: 'cust-1',
        units: 10,
      }),
    ).rejects.toThrow('credit failed');
  });
});
