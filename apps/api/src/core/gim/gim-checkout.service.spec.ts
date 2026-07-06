import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GimCheckoutService } from './gim-checkout.service';
import { GimChargeService } from './gim-charge.service';
import { GimClientService } from './gim-client.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase } from '../__tests__/mock-supabase';

describe('GimCheckoutService', () => {
  let service: GimCheckoutService;
  const mock = createMockSupabase();
  const gimCharge = { executePayByCard: jest.fn() };
  const gimClient = {
    getConfig: jest.fn().mockReturnValue({
      amountMultiplier: 100,
      dateTimeLocalTrxnDigitLength: 12,
    }),
  };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GimCheckoutService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        { provide: GimChargeService, useValue: gimCharge },
        { provide: GimClientService, useValue: gimClient },
      ],
    }).compile();
    service = module.get(GimCheckoutService);
  });

  it('maps prepare_checkout_gim_payment failures to BadRequestException', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'session expired' },
    });

    await expect(
      service.pay({
        checkoutSessionId: 'session-1',
        pan: '4221941234569109',
        expiry: '06/25',
        cvv: '123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns early when GIM payment was already initiated', async () => {
    mock.rpc.mockResolvedValue({
      data: {
        checkout_session_id: 'session-1',
        merchant_reference: 'ref-1',
        transaction_id: 'tx-1',
        already_initiated: true,
      },
      error: null,
    });

    const result = await service.pay({
      checkoutSessionId: 'session-1',
      pan: '4221941234569109',
      expiry: '06/25',
      cvv: '123',
    });

    expect(result.alreadyInitiated).toBe(true);
    expect(gimCharge.executePayByCard).not.toHaveBeenCalled();
  });

  it('requires CVV before creating transaction', async () => {
    mock.rpc.mockResolvedValue({
      data: {
        organization_id: 'org-1',
        merchant_id: 'merchant-1',
        checkout_session_id: 'session-1',
        customer_id: 'cust-1',
        amount: 1000,
        currency_code: 'XOF',
        merchant_reference: 'ref-1',
        transaction_id: null,
        already_initiated: false,
      },
      error: null,
    });

    await expect(
      service.pay({
        checkoutSessionId: 'session-1',
        pan: '4221941234569109',
        expiry: '06/25',
        cvv: '  ',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
