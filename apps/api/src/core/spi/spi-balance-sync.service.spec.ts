import { Test, TestingModule } from '@nestjs/testing';
import { SpiBalanceSyncService } from './spi-balance-sync.service';
import { SpiClientService } from './spi-client.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase } from '../__tests__/mock-supabase';

describe('SpiBalanceSyncService', () => {
  let service: SpiBalanceSyncService;
  const mock = createMockSupabase();
  const spiClient = { executeWithSdk: jest.fn() };

  beforeEach(async () => {
    mock.rpc.mockReset();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiBalanceSyncService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
        { provide: SpiClientService, useValue: spiClient },
      ],
    }).compile();
    service = module.get(SpiBalanceSyncService);
  });

  it('returns unsynced result when SPI account number is missing', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'missing' } });

    const result = await service.syncOrganizationBalance('org-1', 'XOF');

    expect(result).toEqual({
      organizationId: 'org-1',
      balance: null,
      synced: false,
    });
    expect(spiClient.executeWithSdk).not.toHaveBeenCalled();
  });

  it('syncs balance and calls update_spi_account_balance', async () => {
    mock.rpc
      .mockResolvedValueOnce({ data: 'CIC123', error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    spiClient.executeWithSdk.mockImplementation(
      async (_orgId: string, operation: (sdk: unknown) => Promise<unknown>) =>
        operation({
          comptes: {
            getAccount: jest.fn().mockResolvedValue({ solde: 150000 }),
          },
        }),
    );

    const result = await service.syncOrganizationBalance('org-1', 'XOF');

    expect(result.synced).toBe(true);
    expect(result.balance).toBe(150000);
    expect(mock.rpc).toHaveBeenCalledWith('update_spi_account_balance', {
      p_organization_id: 'org-1',
      p_currency_code: 'XOF',
      p_balance: 1500,
      p_synced_at: expect.any(String),
    });
  });

  it('throws when list_orgs_missing_spi_account RPC errors', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc failed' },
    });

    await expect(service.listOrgsMissingSpiAccount()).rejects.toEqual({
      message: 'rpc failed',
    });
  });
});
