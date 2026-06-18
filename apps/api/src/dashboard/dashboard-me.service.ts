import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

@Injectable()
export class DashboardMeService {
  constructor(private readonly supabase: SupabaseService) {}

  getMe(user: DashboardUserContext | { merchantId: string; email?: string }) {
    return {
      merchant_id: user.merchantId,
      organization_id:
        'organizationId' in user ? user.organizationId : undefined,
      environment: 'environment' in user ? user.environment : undefined,
      email: 'email' in user && user.email ? user.email : undefined,
    };
  }

  health() {
    return { status: 'ok', surface: 'dashboard/v1' };
  }
}
