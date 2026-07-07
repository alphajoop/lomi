import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { PartnerKeyGuard } from './partner-key.guard';
import type { SupabaseService } from '../../../utils/supabase/supabase.service';

function createMockContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('PartnerKeyGuard', () => {
  let guard: PartnerKeyGuard;
  let supabase: { rpc: jest.Mock };

  beforeEach(() => {
    supabase = { rpc: jest.fn() };
    guard = new PartnerKeyGuard(supabase as unknown as SupabaseService);
  });

  it('rejects when partner key is missing', async () => {
    const ctx = createMockContext({
      headers: {},
      url: '/partners/v1/provisioning-keys',
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Partner management key is missing',
    );
  });

  it('accepts x-lomi-partner-key header', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          management_key_id: 'mk-1',
          partner_id: 'p-1',
          partner_name: 'Acme',
          partner_slug: 'acme',
        },
      ],
      error: null,
    });

    const req: Record<string, unknown> = {
      headers: { 'x-lomi-partner-key': 'lomi_partner_test' },
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(req.partner).toEqual({
      managementKeyId: 'mk-1',
      partnerId: 'p-1',
      partnerName: 'Acme',
      partnerSlug: 'acme',
    });
  });

  it('rejects invalid partner key', async () => {
    supabase.rpc.mockResolvedValue({
      data: { is_valid: false, message: 'invalid' },
      error: null,
    });

    const ctx = createMockContext({
      headers: { authorization: 'Bearer lomi_partner_bad' },
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
