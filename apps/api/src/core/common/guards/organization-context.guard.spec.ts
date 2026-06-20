import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationContextGuard } from './organization-context.guard';
import { SupabaseService } from '../../../utils/supabase/supabase.service';

describe('OrganizationContextGuard', () => {
  let guard: OrganizationContextGuard;
  let supabase: { rpc: jest.Mock };

  const buildContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as never;

  beforeEach(async () => {
    supabase = { rpc: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationContextGuard,
        Reflector,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    guard = module.get(OrganizationContextGuard);
  });

  it('allows access when verify_dashboard_org_access returns true', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const request = {
      merchantId: 'merchant-1',
      params: { organizationId: 'org-1' },
      headers: { 'x-environment': 'test' },
    };

    await expect(guard.canActivate(buildContext(request))).resolves.toBe(true);
    expect(request).toMatchObject({
      dashboardUser: {
        merchantId: 'merchant-1',
        organizationId: 'org-1',
        environment: 'test',
      },
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_dashboard_org_access',
      expect.objectContaining({
        p_merchant_id: 'merchant-1',
        p_organization_id: 'org-1',
      }),
    );
  });

  it('denies access when membership check fails', async () => {
    supabase.rpc.mockResolvedValue({ data: false, error: null });

    const request = {
      merchantId: 'merchant-1',
      params: { organizationId: 'org-1' },
      headers: {},
    };

    await expect(
      guard.canActivate(buildContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
