import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SpiInvoicingService } from './spi-invoicing.service';
import { SpiClientService } from './spi-client.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase } from '../__tests__/mock-supabase';

describe('SpiInvoicingService', () => {
  let service: SpiInvoicingService;
  const mock = createMockSupabase();
  const spiClient = { executeWithSdk: jest.fn() };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiInvoicingService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        { provide: SpiClientService, useValue: spiClient },
      ],
    }).compile();
    service = module.get(SpiInvoicingService);
  });

  it('maps prepare_invoice_spi_rtp failures to BadRequestException', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'invoice not payable' },
    });

    await expect(
      service.requestPayment({
        organizationId: 'org-1',
        invoiceId: 'inv-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns early when invoice RTP was already initiated', async () => {
    mock.rpc.mockResolvedValue({
      data: {
        already_initiated: true,
        invoice_id: 'inv-1',
        payment_request_id: 'pr-1',
        spi_tx_id: 'SPI-1',
        amount: 5000,
        currency_code: 'XOF',
      },
      error: null,
    });

    const result = await service.requestPayment({
      organizationId: 'org-1',
      invoiceId: 'inv-1',
    });

    expect(result.alreadyInitiated).toBe(true);
    expect(spiClient.executeWithSdk).not.toHaveBeenCalled();
  });

  it('requires at least one invoice for bulk RTP', async () => {
    await expect(
      service.bulkRequestPayment({
        organizationId: 'org-1',
        invoiceIds: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
