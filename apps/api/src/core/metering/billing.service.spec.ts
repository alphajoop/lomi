import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('BillingService', () => {
  let service: BillingService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(BillingService);
  });

  it('calls process_usage_billing_cycle with as-of date', async () => {
    mock.rpc.mockResolvedValue({ data: { processed: 3 }, error: null });

    const result = await service.executeUsageBillingCycle('2026-07-06');

    expect(result).toEqual({ processed: 3 });
    expect(mock.rpc).toHaveBeenCalledWith('process_usage_billing_cycle', {
      p_as_of_date: '2026-07-06',
    });
  });

  it('throws when billing cycle RPC errors', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'cycle failed' } });

    await expect(service.executeUsageBillingCycle('2026-07-06')).rejects.toThrow(
      'cycle failed',
    );
  });

  it('throws NotFoundException when subscription usage is missing', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      service.getSubscriptionUsage('sub-missing', user),
    ).rejects.toThrow(NotFoundException);
  });
});
