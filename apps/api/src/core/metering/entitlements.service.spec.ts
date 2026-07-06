import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementsService } from './entitlements.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { createMockSupabase, testUser } from '../__tests__/mock-supabase';
import type { AuthContext } from '../common/decorators/current-user.decorator';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  const mock = createMockSupabase();
  const user = testUser as AuthContext;

  beforeEach(async () => {
    mock.rpc.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementsService,
        {
          provide: SupabaseService,
          useValue: { rpc: mock.rpc, getClient: mock.getClient },
        },
      ],
    }).compile();
    service = module.get(EntitlementsService);
  });

  it('calls create_entitlement with organization scope', async () => {
    mock.rpc.mockResolvedValue({ data: 'ent-1', error: null });

    const result = await service.create(user, {
      feature_key: 'api_access',
      name: 'API Access',
    });

    expect(result).toEqual({ entitlement_id: 'ent-1' });
    expect(mock.rpc).toHaveBeenCalledWith(
      'create_entitlement',
      expect.objectContaining({
        p_organization_id: user.organizationId,
        p_feature_key: 'api_access',
        p_name: 'API Access',
      }),
    );
  });

  it('calls check_entitlement for a customer and feature', async () => {
    mock.rpc.mockResolvedValue({ data: { allowed: true }, error: null });

    const result = await service.check('cust-1', 'api_access');

    expect(result).toEqual({ allowed: true });
    expect(mock.rpc).toHaveBeenCalledWith('check_entitlement', {
      p_customer_id: 'cust-1',
      p_feature_key: 'api_access',
    });
  });

  it('propagates RPC errors from check', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: 'check failed' } });

    await expect(service.check('cust-1', 'api_access')).rejects.toThrow(
      'check failed',
    );
  });
});
