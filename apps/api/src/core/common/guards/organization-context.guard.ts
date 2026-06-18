import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../../utils/supabase/supabase.service';
import {
  normalizePaymentEnvironment,
  type LomiPaymentEnvironment,
} from '../../../utils/payment-environment';
import { DASHBOARD_PERMISSION_KEY } from '../../../dashboard/decorators/dashboard-permission.decorator';
import type { DashboardUserContext } from '../../../dashboard/decorators/dashboard-user.decorator';

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const merchantId = request.merchantId as string | undefined;

    if (!merchantId) {
      throw new UnauthorizedException('Session required');
    }

    const paramOrg = request.params?.organizationId as string | undefined;
    const headerOrg = request.headers['x-organization-id'] as
      | string
      | undefined;
    const organizationId = paramOrg ?? headerOrg;

    if (!organizationId) {
      throw new ForbiddenException('Organization context required');
    }

    if (paramOrg && headerOrg && paramOrg !== headerOrg) {
      throw new ForbiddenException('Organization header mismatch');
    }

    const permission =
      this.reflector.getAllAndOverride<string | undefined>(
        DASHBOARD_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? null;

    const { data, error } = await this.supabase.rpc(
      'verify_dashboard_org_access' as never,
      {
        p_merchant_id: merchantId,
        p_organization_id: organizationId,
        p_permission_key: permission,
      } as never,
    );

    if (error || data !== true) {
      throw new ForbiddenException('Access denied for organization');
    }

    const envHeader = request.headers['x-environment'] as string | undefined;
    const environment: LomiPaymentEnvironment = normalizePaymentEnvironment(
      envHeader ?? 'live',
    );

    const dashboardUser: DashboardUserContext = {
      merchantId,
      organizationId,
      environment,
    };

    request.dashboardUser = dashboardUser;

    return true;
  }
}
