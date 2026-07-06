import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('AccountsService', () => {
  let service: AccountsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(AccountsService);
  });

  it('calls list_accounts with organization scope', async () => {
    mock.rpc.mockResolvedValue({ data: [{ account_id: 'acct-1' }], error: null });

    const result = await service.findAll(user);

    expect(result).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'list_accounts',
      expect.objectContaining({
        p_organization_id: user.organizationId,
      }),
    );
  });

  it('throws NotFoundException when account is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.findOne('missing', user)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when requested currency balance is missing', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    await expect(service.getBalance(user, 'USD')).rejects.toThrow(
      NotFoundException,
    );
  });
});
