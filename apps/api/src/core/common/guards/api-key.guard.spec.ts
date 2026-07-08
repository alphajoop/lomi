import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { RedisService } from '../../../utils/redis/redis.service';

function createMockContext(request: Record<string, any>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let supabase: { rpc: jest.Mock };
  let redis: { get: jest.Mock; setex: jest.Mock };

  beforeEach(() => {
    supabase = { rpc: jest.fn() };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue(true),
    };
    guard = new ApiKeyGuard(
      supabase as unknown as SupabaseService,
      redis as unknown as RedisService,
    );
  });

  it('rejects when API key header is missing', async () => {
    const ctx = createMockContext({
      headers: {},
      url: '/transactions',
      method: 'GET',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow('API Key is missing');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('accepts API key from X-API-KEY header', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm2',
          organization_id: 'o2',
          environment: 'live',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_test_abc' },
      url: '/checkout-sessions',
      method: 'POST',
      ip: '192.168.1.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_api_key_context',
      expect.objectContaining({
        p_api_key: 'sk_test_abc',
        p_endpoint: '/checkout-sessions',
        p_request_method: 'POST',
        p_ip_address: '192.168.1.1',
        p_lomi_account: null,
        p_required_capability: null,
      }),
    );
    expect(req.user).toEqual({
      apiKey: 'sk_test_abc',
      merchantId: 'm2',
      actorOrganizationId: 'o2',
      targetOrganizationId: 'o2',
      organizationId: 'o2',
      environment: 'live',
      isNetworkRequest: false,
      lomiAccount: null,
      networkAccountId: null,
      networkMembershipId: null,
      publicAccountId: null,
      networkCapabilityKey: null,
    });
  });

  it('accepts API key from Authorization: Bearer', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm1',
          organization_id: 'o1',
          environment: 'test',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { authorization: 'Bearer secret' },
      url: '/payment-requests',
      method: 'POST',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_api_key_context',
      expect.objectContaining({
        p_api_key: 'secret',
        p_endpoint: '/payment-requests',
        p_request_method: 'POST',
        p_ip_address: '127.0.0.1',
        p_lomi_account: null,
        p_required_capability: null,
      }),
    );
    expect(req.user).toEqual({
      apiKey: 'secret',
      merchantId: 'm1',
      actorOrganizationId: 'o1',
      targetOrganizationId: 'o1',
      organizationId: 'o1',
      environment: 'test',
      isNetworkRequest: false,
      lomiAccount: null,
      networkAccountId: null,
      networkMembershipId: null,
      publicAccountId: null,
      networkCapabilityKey: null,
    });
  });

  it('authorizes supported Network requests with required capability', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm_operator',
          actor_organization_id: 'org_operator',
          target_organization_id: 'org_member',
          organization_id: 'org_member',
          environment: 'live',
          is_network_request: true,
          network_account_id: 'net_acct_1',
          network_membership_id: 'net_mem_1',
          public_account_id: 'acct_123',
          network_capability_key: 'payment.create',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_live_network', 'lomi-account': 'acct_123' },
      url: '/charge/card',
      method: 'POST',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_api_key_context',
      expect.objectContaining({
        p_lomi_account: 'acct_123',
        p_required_capability: 'payment.create',
      }),
    );
    expect(req.user).toEqual({
      apiKey: 'sk_live_network',
      merchantId: 'm_operator',
      actorOrganizationId: 'org_operator',
      targetOrganizationId: 'org_member',
      organizationId: 'org_member',
      environment: 'live',
      isNetworkRequest: true,
      lomiAccount: 'acct_123',
      networkAccountId: 'net_acct_1',
      networkMembershipId: 'net_mem_1',
      publicAccountId: 'acct_123',
      networkCapabilityKey: 'payment.create',
    });
  });

  it('authorizes Network customer writes with customer.write', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm_operator',
          actor_organization_id: 'org_operator',
          target_organization_id: 'org_member',
          organization_id: 'org_member',
          environment: 'live',
          is_network_request: true,
          network_account_id: 'net_acct_1',
          network_membership_id: 'net_mem_1',
          public_account_id: 'acct_123',
          network_capability_key: 'customer.write',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_live_network', 'lomi-account': 'acct_123' },
      url: '/customers',
      method: 'POST',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_api_key_context',
      expect.objectContaining({
        p_lomi_account: 'acct_123',
        p_required_capability: 'customer.write',
      }),
    );
  });

  it('authorizes Network customer reads with customer.read', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm_operator',
          actor_organization_id: 'org_operator',
          target_organization_id: 'org_member',
          organization_id: 'org_member',
          environment: 'live',
          is_network_request: true,
          network_account_id: 'net_acct_1',
          network_membership_id: 'net_mem_1',
          public_account_id: 'acct_123',
          network_capability_key: 'customer.read',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_live_network', 'lomi-account': 'acct_123' },
      url: '/customers',
      method: 'GET',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_api_key_context',
      expect.objectContaining({
        p_lomi_account: 'acct_123',
        p_required_capability: 'customer.read',
      }),
    );
    expect(req.user.networkCapabilityKey).toBe('customer.read');
  });

  it('authorizes Network card charge polling with transaction.read_own', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm_operator',
          actor_organization_id: 'org_operator',
          target_organization_id: 'org_member',
          organization_id: 'org_member',
          environment: 'live',
          is_network_request: true,
          network_account_id: 'net_acct_1',
          network_membership_id: 'net_mem_1',
          public_account_id: 'acct_123',
          network_capability_key: 'transaction.read_own',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_live_network', 'lomi-account': 'acct_123' },
      url: '/charge/card/pi_123',
      method: 'GET',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'verify_api_key_context',
      expect.objectContaining({
        p_required_capability: 'transaction.read_own',
      }),
    );
  });

  it('rejects Network checkout-session reads until Network-aware read RPCs exist', async () => {
    const ctx = createMockContext({
      headers: { 'x-api-key': 'sk_live_network', 'lomi-account': 'acct_123' },
      url: '/checkout-sessions',
      method: 'GET',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Network requests are not supported for this endpoint',
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('rejects Lomi-Account on endpoints not enabled for Network', async () => {
    const ctx = createMockContext({
      headers: { 'x-api-key': 'sk', 'lomi-account': 'acct_123' },
      url: '/accounts',
      method: 'GET',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Network requests are not supported for this endpoint',
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('rejects when verify_api_key returns invalid', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ is_valid: false }],
      error: null,
    });

    const ctx = createMockContext({
      headers: { 'x-api-key': 'bad' },
      url: '/',
      method: 'GET',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects when verify_api_key RPC errors', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc down' },
    });

    const ctx = createMockContext({
      headers: { 'x-api-key': 'k' },
      url: '/',
      method: 'GET',
      ip: '127.0.0.1',
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('serves non-network auth from Redis cache and skips Supabase', async () => {
    redis.get.mockResolvedValue(
      JSON.stringify({
        merchantId: 'm-cached',
        actorOrganizationId: 'o-cached',
        targetOrganizationId: 'o-cached',
        organizationId: 'o-cached',
        environment: 'live',
        isNetworkRequest: false,
        networkAccountId: null,
        networkMembershipId: null,
        publicAccountId: null,
        networkCapabilityKey: null,
      }),
    );

    const req: any = {
      headers: { 'x-api-key': 'sk_cached' },
      url: '/checkout-sessions',
      method: 'POST',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(req.user.merchantId).toBe('m-cached');
    expect(req.user.organizationId).toBe('o-cached');
  });

  it('writes Redis cache after a successful non-network verify', async () => {
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm2',
          organization_id: 'o2',
          environment: 'live',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_test_abc' },
      url: '/me',
      method: 'GET',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(redis.setex).toHaveBeenCalled();
  });

  it('does not use Redis cache for Network (Lomi-Account) requests', async () => {
    redis.get.mockResolvedValue(
      JSON.stringify({
        merchantId: 'should-not-use',
        actorOrganizationId: 'o',
        targetOrganizationId: 'o',
        organizationId: 'o',
        environment: 'live',
        isNetworkRequest: false,
        networkAccountId: null,
        networkMembershipId: null,
        publicAccountId: null,
        networkCapabilityKey: null,
      }),
    );
    supabase.rpc.mockResolvedValue({
      data: [
        {
          is_valid: true,
          merchant_id: 'm_operator',
          actor_organization_id: 'org_operator',
          target_organization_id: 'org_member',
          organization_id: 'org_member',
          environment: 'live',
          is_network_request: true,
          network_account_id: 'net_acct_1',
          network_membership_id: 'net_mem_1',
          public_account_id: 'acct_123',
          network_capability_key: 'payment.create',
        },
      ],
      error: null,
    });

    const req: any = {
      headers: { 'x-api-key': 'sk_live_network', 'lomi-account': 'acct_123' },
      url: '/checkout-sessions',
      method: 'POST',
      ip: '127.0.0.1',
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(redis.get).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalled();
  });
});
