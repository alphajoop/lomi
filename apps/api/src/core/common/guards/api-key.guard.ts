import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import { normalizePaymentEnvironment } from '../../../utils/payment-environment';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);
    const lomiAccount = this.extractLomiAccount(request);

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    const requiredCapability = this.resolveNetworkCapability(
      request.method,
      request.url,
    );

    if (lomiAccount && !requiredCapability) {
      throw new UnauthorizedException(
        'Network requests are not supported for this endpoint',
      );
    }

    const { data, error } = await this.supabase.rpc(
      'verify_api_key_context' as any,
      {
        p_api_key: apiKey,
        p_endpoint: request.url,
        p_request_method: request.method,
        p_ip_address: request.ip,
        p_lomi_account: lomiAccount,
        p_required_capability: lomiAccount ? requiredCapability : null,
      } as any,
    );

    if (error || !data || data.length === 0 || !data[0].is_valid) {
      throw new UnauthorizedException(data?.[0]?.message || 'Invalid API Key');
    }

    const row = data[0];
    const actorOrganizationId =
      row.actor_organization_id || row.organization_id;
    const targetOrganizationId =
      row.target_organization_id || row.organization_id;

    // Attach context to request
    request.user = {
      apiKey,
      merchantId: row.merchant_id,
      actorOrganizationId,
      targetOrganizationId,
      organizationId: row.organization_id || targetOrganizationId,
      environment: normalizePaymentEnvironment(row.environment),
      isNetworkRequest: Boolean(row.is_network_request),
      lomiAccount,
      networkAccountId: row.network_account_id || null,
      networkMembershipId: row.network_membership_id || null,
      publicAccountId: row.public_account_id || lomiAccount || null,
      networkCapabilityKey: row.network_capability_key || null,
    };
    request.apiKey = apiKey;

    // Validate Environment
    // We trust the API key's environment. The user can use a test key on any host (e.g. localhost or api.lomi.africa)
    // and it will be treated as a test request.
    // The service layer will use this environment to scope data.

    return true;
  }

  private extractApiKey(request: any): string | undefined {
    // 1. Check lomi API key headers
    if (request.headers['x-api-key']) {
      return request.headers['x-api-key'] as string;
    }

    if (request.headers['x-lomi-api-key']) {
      return request.headers['x-lomi-api-key'] as string;
    }

    // 2. Check Bearer token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return undefined;
  }

  private extractLomiAccount(request: any): string | null {
    const header = request.headers['lomi-account'];
    if (Array.isArray(header)) {
      return header[0]?.trim() || null;
    }
    return typeof header === 'string' && header.trim() ? header.trim() : null;
  }

  private resolveNetworkCapability(method: string, url: string): string | null {
    const path = normalizePath(url);
    const upperMethod = method.toUpperCase();

    if (upperMethod === 'POST' && /^\/charge\/(card|wave|mtn)$/.test(path)) {
      return 'payment.create';
    }

    if (
      upperMethod === 'POST' &&
      /^\/charge\/card\/[^/]+\/cancel$/.test(path)
    ) {
      return 'payment.create';
    }

    if (upperMethod === 'GET' && /^\/charge\/card\/[^/]+$/.test(path)) {
      return 'transaction.read_own';
    }

    if (upperMethod === 'POST' && path === '/checkout-sessions') {
      return 'payment.create';
    }

    if (upperMethod === 'GET' && /^\/transactions(?:\/[^/]+)?$/.test(path)) {
      return 'transaction.read_own';
    }

    if (upperMethod === 'POST' && path === '/refunds') {
      return 'refund.create';
    }

    if (upperMethod === 'GET' && /^\/refunds(?:\/[^/]+)?$/.test(path)) {
      return 'transaction.read_own';
    }

    if (upperMethod === 'GET' && path === '/customers') {
      return 'customer.read';
    }

    if (
      upperMethod === 'GET' &&
      /^\/customers\/[^/]+\/transactions$/.test(path)
    ) {
      return 'customer.read';
    }

    if (upperMethod === 'GET' && /^\/customers\/[^/]+$/.test(path)) {
      return 'customer.read';
    }

    if (upperMethod === 'POST' && path === '/customers') {
      return 'customer.write';
    }

    if (upperMethod === 'PATCH' && /^\/customers\/[^/]+$/.test(path)) {
      return 'customer.write';
    }

    return null;
  }
}

function normalizePath(url: string): string {
  const [path = '/'] = url.split('?');
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}
