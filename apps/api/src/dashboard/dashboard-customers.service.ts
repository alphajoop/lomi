import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

export type DashboardCustomerRow = Record<string, unknown>;

export interface DashboardCustomersListResult {
  data: DashboardCustomerRow[];
  total_count: number;
}

@Injectable()
export class DashboardCustomersService {
  constructor(private readonly supabase: SupabaseService) {}

  async listCustomers(
    user: DashboardUserContext,
    options: {
      searchTerm?: string;
      segment?: string;
      limit?: number;
      offset?: number;
      customerType?: string;
    },
  ): Promise<DashboardCustomersListResult> {
    const segment =
      !options.segment || options.segment === 'all' ? 'all' : options.segment;

    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_customers' as never,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_segment: segment,
        p_search_term: options.searchTerm ?? null,
        p_customer_type: options.customerType ?? 'all',
        p_offset: options.offset ?? 0,
        p_limit: options.limit ?? 200,
        p_environment: user.environment,
      } as never,
    );

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as DashboardCustomerRow[];
    const totalCount =
      rows.length > 0 ? Number(rows[0]?.['total_count'] ?? 0) : 0;

    return { data: rows, total_count: totalCount };
  }
}
