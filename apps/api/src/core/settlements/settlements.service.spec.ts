import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettlementsService } from './settlements.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('SettlementsService', () => {
  let service: SettlementsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(SettlementsService);
  });

  it('calls fetch_settlement_periods with merchant and environment', async () => {
    mock.rpc.mockResolvedValue({ data: [{ settlement_id: 'XOF:2026-06-01' }], error: null });

    const result = await service.findAll(user, 1, 50, '2026-06-01', '2026-06-30', 'XOF');

    expect(result).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_settlement_periods',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_merchant_id: user.merchantId,
        p_environment: 'live',
        p_currency: 'XOF',
      }),
    );
  });

  it('rejects invalid settlement id format', async () => {
    await expect(
      service.findTransactions(user, 'not-a-settlement'),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps fetch_settlement_periods RPC errors to BadRequestException', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'bad request' } });

    await expect(service.findAll(user)).rejects.toThrow(BadRequestException);
  });
});
