import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockClientRpc: jest.Mock;

  const user: AuthContext = {
    merchantId: 'merch_1',
    organizationId: 'org_1',
    environment: 'test',
  } as AuthContext;

  const networkUser: AuthContext = {
    merchantId: 'merch_operator',
    actorOrganizationId: 'org_operator',
    targetOrganizationId: 'org_member',
    organizationId: 'org_member',
    environment: 'live',
    isNetworkRequest: true,
    networkMembershipId: 'nm-1',
    networkAccountId: 'na-1',
    lomiAccount: 'acct_member',
    publicAccountId: 'acct_member',
    networkCapabilityKey: 'transaction.read_own',
  };

  beforeEach(async () => {
    mockClientRpc = jest.fn();
    const mockSupabase = {
      getClient: jest.fn(() => ({
        rpc: mockClientRpc,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('calls fetch_transactions with expected RPC payload', async () => {
      const rows = [{ transaction_id: 't1' }];
      mockClientRpc.mockResolvedValue({ data: rows, error: null });

      const result = await service.findAll(
        user,
        'WAVE',
        ['completed'],
        ['payment'],
        ['XOF'],
        ['MOBILE_MONEY'],
        2,
        25,
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z',
        true,
      );

      expect(result).toEqual(rows);
      expect(mockClientRpc).toHaveBeenCalledWith(
        'fetch_transactions',
        expect.objectContaining({
          p_organization_id: user.organizationId,
          p_provider_code: 'WAVE',
          p_status: ['completed'],
          p_type: ['payment'],
          p_currency: ['XOF'],
          p_payment_method: ['MOBILE_MONEY'],
          p_page: 2,
          p_page_size: 25,
          p_start_date: '2024-01-01T00:00:00Z',
          p_end_date: '2024-12-31T23:59:59Z',
          p_is_pos: true,
          p_environment: 'test',
        }),
      );
    });

    it('returns empty array when RPC returns null data', async () => {
      mockClientRpc.mockResolvedValue({ data: null, error: null });
      await expect(service.findAll(user)).resolves.toEqual([]);
    });

    it('throws when RPC errors', async () => {
      mockClientRpc.mockResolvedValue({
        data: null,
        error: { message: 'nope' },
      });
      await expect(service.findAll(user)).rejects.toThrow('nope');
    });

    it('routes Network list requests to fetch_network_transactions_for_api with own scope', async () => {
      const rows = [{ transaction_id: 't-network' }];
      mockClientRpc.mockResolvedValue({ data: rows, error: null });

      const result = await service.findAll(
        networkUser,
        'WAVE',
        ['completed'],
        undefined,
        ['XOF'],
        undefined,
        1,
        10,
      );

      expect(result).toEqual(rows);
      expect(mockClientRpc).toHaveBeenCalledWith(
        'fetch_network_transactions_for_api',
        expect.objectContaining({
          p_network_membership_id: 'nm-1',
          p_read_scope: 'own',
          p_environment: 'live',
        }),
      );
    });

    it('uses all read scope when transaction.read capability is granted', async () => {
      mockClientRpc.mockResolvedValue({ data: [], error: null });

      await service.findAll({
        ...networkUser,
        networkCapabilityKey: 'transaction.read',
      });

      expect(mockClientRpc).toHaveBeenCalledWith(
        'fetch_network_transactions_for_api',
        expect.objectContaining({
          p_read_scope: 'all',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns first transaction row', async () => {
      const row = { transaction_id: 't1', amount: 1 };
      mockClientRpc.mockResolvedValue({ data: [row], error: null });

      await expect(service.findOne('t1', user)).resolves.toEqual(row);
      expect(mockClientRpc).toHaveBeenCalledWith(
        'get_transaction',
        expect.objectContaining({
          p_transaction_id: 't1',
          p_organization_id: user.organizationId,
        }),
      );
    });

    it('throws NotFound when RPC returns empty', async () => {
      mockClientRpc.mockResolvedValue({ data: [], error: null });
      await expect(service.findOne('missing', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when transaction_id missing in payload', async () => {
      mockClientRpc.mockResolvedValue({ data: [{ foo: 'bar' }], error: null });
      await expect(service.findOne('t1', user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('routes Network get requests to get_network_transaction_for_api', async () => {
      const row = { transaction_id: 't-network' };
      mockClientRpc.mockResolvedValue({ data: [row], error: null });

      await expect(service.findOne('t-network', networkUser)).resolves.toEqual(
        row,
      );
      expect(mockClientRpc).toHaveBeenCalledWith(
        'get_network_transaction_for_api',
        expect.objectContaining({
          p_network_membership_id: 'nm-1',
          p_transaction_id: 't-network',
          p_read_scope: 'own',
        }),
      );
    });
  });
});
