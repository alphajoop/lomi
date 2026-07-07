import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('ProvidersService', () => {
  let service: ProvidersService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(ProvidersService);
  });

  it('calls fetch_organization_providers_settings_api with merchant scope', async () => {
    mock.rpc.mockResolvedValue({
      data: [{ provider_code: 'WAVE' }],
      error: null,
    });

    const result = await service.findAll(user, 'WAVE');

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mock.rpc).toHaveBeenCalledWith(
      'fetch_organization_providers_settings_api',
      expect.objectContaining({
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_provider_code: 'WAVE',
      }),
    );
  });

  it('returns empty array when RPC data is null', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: null });

    const result = await service.findAll(user);

    expect(result.data).toEqual([]);
  });

  it('propagates RPC errors', async () => {
    mock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'providers failed' },
    });

    await expect(service.findAll(user)).rejects.toThrow('providers failed');
  });
});
