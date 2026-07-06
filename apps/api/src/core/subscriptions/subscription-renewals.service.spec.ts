import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRenewalsService } from './subscription-renewals.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { StripeClientsService } from '../../utils/stripe/stripe-clients.service';
import { createMockSupabase } from '../__tests__/mock-supabase';

describe('SubscriptionRenewalsService', () => {
  let service: SubscriptionRenewalsService;
  const mock = createMockSupabase();

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRenewalsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        {
          provide: StripeClientsService,
          useValue: { getClient: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(SubscriptionRenewalsService);
  });

  it('calls get_active_subscriptions_for_renewal with due date', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    const result = await service.executeRenewals('2026-07-06');

    expect(result).toEqual({ success: true, processed_count: 0, results: [] });
    expect(mock.rpc).toHaveBeenCalledWith(
      'get_active_subscriptions_for_renewal',
      { p_due_date: '2026-07-06' },
    );
  });

  it('propagates RPC errors when fetching due subscriptions', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'renewal fetch failed' },
    });

    await expect(service.executeRenewals('2026-07-06')).rejects.toThrow(
      'renewal fetch failed',
    );
  });

  it('skips subscriptions already processed for the billing date', async () => {
    mock.rpc
      .mockResolvedValueOnce({
        data: [
          {
            subscription_id: 'sub-1',
            organization_id: 'org-1',
            customer_email: 'a@b.com',
            next_billing_date: '2026-07-06',
            price_amount: 1000,
            price_currency_code: 'XOF',
            provider_customer_id: 'cus_1',
            provider_payment_method_id: 'pm_1',
            environment: 'live',
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    const result = await service.executeRenewals('2026-07-06');

    expect(result.results).toEqual([
      { subscription_id: 'sub-1', status: 'skipped', error: null },
    ]);
    expect(mock.rpc).toHaveBeenCalledWith(
      'subscription_renewal_already_processed',
      {
        p_subscription_id: 'sub-1',
        p_billing_date: '2026-07-06',
      },
    );
  });
});
