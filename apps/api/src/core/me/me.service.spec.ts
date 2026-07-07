import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MeService } from './me.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('MeService', () => {
  let service: MeService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(MeService);
  });

  it('returns merchant and organization info from list_organizations', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ name: 'Acme Corp' }],
      error: null,
    });

    const result = await service.getMe(user);

    expect(result).toEqual({
      merchant_id: user.merchantId,
      organization_id: user.organizationId,
      organization_name: 'Acme Corp',
      environment: 'live',
    });
    expect(mock.rpc).toHaveBeenCalledWith('list_organizations', {
      p_organization_id: user.organizationId,
    });
  });

  it('falls back to default organization name when RPC row is empty', async () => {
    mock.rpc.mockResolvedValue({ data: [], error: null });

    const result = await service.getMe(user);

    expect(result.organization_name).toBe('Organization');
  });

  it('maps RPC errors to InternalServerErrorException', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'db down' } });

    await expect(service.getMe(user)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
