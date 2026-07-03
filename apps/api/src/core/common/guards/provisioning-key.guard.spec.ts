import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ProvisioningKeyGuard } from './provisioning-key.guard';
import type { SupabaseService } from '../../../utils/supabase/supabase.service';

function createMockContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('ProvisioningKeyGuard', () => {
  let guard: ProvisioningKeyGuard;
  let supabase: { rpc: jest.Mock };

  beforeEach(() => {
    supabase = { rpc: jest.fn() };
    guard = new ProvisioningKeyGuard(supabase as unknown as SupabaseService);
  });

  it('rejects when provisioning key is missing', async () => {
    const ctx = createMockContext({
      headers: {},
      url: '/provisioning/v1/accounts',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Provisioning key is missing',
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('accepts x-lomi-provisioning-key header', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          provisioning_key_id: 'pk-1',
          partner_name: 'acme',
          environment: 'test',
        },
      ],
      error: null,
    });

    const req: Record<string, unknown> = {
      headers: { 'x-lomi-provisioning-key': 'lomi_prov_test' },
      url: '/provisioning/v1/accounts',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(req.provisioning).toEqual({
      provisioningKey: 'lomi_prov_test',
      provisioningKeyId: 'pk-1',
      partnerName: 'acme',
      environment: 'test',
    });
  });

  it('accepts Bearer lomi_prov_* token', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        is_valid: true,
        provisioning_key_id: 'pk-2',
        partner_name: 'self',
        environment: 'live',
      },
      error: null,
    });

    const req: Record<string, unknown> = {
      headers: { authorization: 'Bearer lomi_prov_abc' },
      url: '/provisioning/v1/accounts',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect((req.provisioning as { environment: string }).environment).toBe(
      'live',
    );
  });

  it('rejects invalid provisioning key', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ is_valid: false, message: 'revoked' }],
      error: null,
    });

    const ctx = createMockContext({
      headers: { 'x-lomi-provisioning-key': 'lomi_prov_bad' },
      url: '/provisioning/v1/accounts',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
