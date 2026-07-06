import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SpiCheckoutService } from './spi-checkout.service';
import { SpiClientService } from './spi-client.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase } from '../__tests__/mock-supabase';

describe('SpiCheckoutService', () => {
  let service: SpiCheckoutService;
  const mock = createMockSupabase();
  const spiClient = { executeWithSdk: jest.fn() };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiCheckoutService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        { provide: SpiClientService, useValue: spiClient },
      ],
    }).compile();
    service = module.get(SpiCheckoutService);
  });

  it('requires payeurAlias', async () => {
    await expect(
      service.initRequestToPay({
        checkoutSessionId: 'session-1',
        payeurAlias: '  ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns early when checkout SPI payment was already initiated', async () => {
    mock.rpc.mockResolvedValue({
      data: {
        checkout_session_id: 'session-1',
        spi_tx_id: 'SPI-1',
        amount: 1000,
        currency_code: 'XOF',
        expires_at: '2026-07-07T00:00:00.000Z',
        transaction_id: 'tx-1',
        already_initiated: true,
      },
      error: null,
    });

    const result = await service.initRequestToPay({
      checkoutSessionId: 'session-1',
      payeurAlias: 'alias-1',
    });

    expect(result.alreadyInitiated).toBe(true);
    expect(spiClient.executeWithSdk).not.toHaveBeenCalled();
    expect(mock.rpc).toHaveBeenCalledWith('prepare_checkout_spi_payment', {
      p_checkout_session_id: 'session-1',
    });
  });

  it('maps get_checkout_spi_payment_status RPC errors to BadRequestException', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(service.getPaymentStatus('session-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
