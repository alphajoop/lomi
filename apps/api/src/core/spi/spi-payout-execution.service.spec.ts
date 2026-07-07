import { Test, TestingModule } from '@nestjs/testing';
import { SpiPayoutExecutionService } from './spi-payout-execution.service';
import { SpiClientService } from './spi-client.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase } from '../__tests__/mock-supabase';

describe('SpiPayoutExecutionService', () => {
  let service: SpiPayoutExecutionService;
  const mock = createMockSupabase();
  const spiClient = { executeWithSdk: jest.fn() };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiPayoutExecutionService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        { provide: SpiClientService, useValue: spiClient },
      ],
    }).compile();
    service = module.get(SpiPayoutExecutionService);
  });

  it('fails payout when payout method is not found', async () => {
    mock.rpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(
      service.executeAfterInitiation(
        'org-1',
        'pm-1',
        1000,
        'XOF',
        { payout_id: 'payout-1', spi_tx_id: 'SPI-1' },
      ),
    ).rejects.toThrow('Payout method not found');

    expect(mock.rpc).toHaveBeenCalledWith('fail_spi_payout', {
      p_payout_id: 'payout-1',
      p_spi_tx_id: 'SPI-1',
      p_error: 'Payout method not found',
    });
  });

  it('fails payout when SPI aliases are missing', async () => {
    mock.rpc
      .mockResolvedValueOnce({
        data: [{ spi_alias_shid: null, spi_alias_mbno: null, spi_account_number: null }],
        error: null,
      })
      .mockResolvedValueOnce({ data: 'payer-alias', error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(
      service.executeAfterInitiation(
        'org-1',
        'pm-1',
        1000,
        'XOF',
        { payout_id: 'payout-1', spi_tx_id: 'SPI-1' },
      ),
    ).rejects.toThrow('SPI account or destination alias missing');
  });

  it('executes SPI payout and returns status', async () => {
    mock.rpc
      .mockResolvedValueOnce({
        data: [{ spi_alias_shid: 'payee-alias', spi_alias_mbno: null, spi_account_number: null }],
        error: null,
      })
      .mockResolvedValueOnce({ data: 'payer-alias', error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    spiClient.executeWithSdk.mockImplementation(
      async (_orgId: string, operation: (sdk: unknown) => Promise<unknown>) =>
        operation({
          paiements: {
            create: jest.fn().mockResolvedValue({ statut: 'ENVOYE' }),
          },
        }),
    );

    const result = await service.executeAfterInitiation(
      'org-1',
      'pm-1',
      1000,
      'XOF',
      { payout_id: 'payout-1', spi_tx_id: 'SPI-1' },
    );

    expect(result).toEqual({
      payoutId: 'payout-1',
      spiTxId: 'SPI-1',
      spiStatus: 'ENVOYE',
    });
    expect(mock.rpc).toHaveBeenCalledWith('update_spi_payout_status', {
      p_payout_id: 'payout-1',
      p_status: 'processing',
      p_spi_tx_id: 'SPI-1',
    });
  });
});
