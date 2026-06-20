import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SpiPosService } from './spi-pos.service';
import { SpiClientService } from './spi-client.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';

describe('SpiPosService', () => {
  let service: SpiPosService;
  const rpcMock = jest.fn();

  const spiClientMock = {
    getSdk: jest.fn(),
    getOrCreateMerchantShidAlias: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiPosService,
        {
          provide: SupabaseService,
          useValue: { rpc: rpcMock },
        },
        {
          provide: SpiClientService,
          useValue: spiClientMock,
        },
      ],
    }).compile();

    service = module.get(SpiPosService);
  });

  it('initiates QR payment through prepare, SPI SDK, and finalize RPCs', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: {
          checkout_session_id: 'session-1',
          payment_request_id: 'pr-1',
          transaction_id: 'tx-1',
          spi_account_number: 'CIC123',
          spi_tx_id: 'POS-session-1',
          amount: 2500,
          currency_code: 'XOF',
          country_code: 'SN',
          expires_at: '2026-06-21T00:00:00.000Z',
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { success: true }, error: null });

    spiClientMock.getSdk.mockResolvedValue({
      demandesPaiement: {
        create: jest.fn().mockResolvedValue({ statut: 'INITIE' }),
      },
      qr: {
        payload: jest.fn().mockReturnValue('EMV_QR_PAYLOAD'),
      },
    });
    spiClientMock.getOrCreateMerchantShidAlias.mockResolvedValue('alias-shid');

    const result = await service.initQrPayment({
      organizationId: 'org-1',
      merchantId: 'merchant-1',
      amount: 2500,
    });

    expect(result.qrPayload).toBe('EMV_QR_PAYLOAD');
    expect(result.checkoutSessionId).toBe('session-1');
    expect(rpcMock).toHaveBeenCalledWith(
      'prepare_pos_spi_payment',
      expect.objectContaining({ p_amount: 2500 }),
    );
    expect(rpcMock).toHaveBeenCalledWith(
      'finalize_pos_spi_payment_initiated',
      expect.objectContaining({ p_qr_payload: 'EMV_QR_PAYLOAD' }),
    );
  });

  it('finalizes failure when SPI SDK throws', async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: {
          checkout_session_id: 'session-2',
          payment_request_id: 'pr-2',
          transaction_id: 'tx-2',
          spi_account_number: 'CIC123',
          spi_tx_id: 'POS-session-2',
          amount: 1000,
          currency_code: 'XOF',
          country_code: 'SN',
          expires_at: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { success: false }, error: null });

    spiClientMock.getSdk.mockRejectedValue(new Error('SPI down'));

    await expect(
      service.initQrPayment({
        organizationId: 'org-1',
        merchantId: 'merchant-1',
        amount: 1000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(rpcMock).toHaveBeenLastCalledWith(
      'finalize_pos_spi_payment_initiated',
      expect.objectContaining({ p_spi_init_success: false }),
    );
  });
});
