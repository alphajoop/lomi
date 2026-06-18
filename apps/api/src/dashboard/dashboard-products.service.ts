import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

export type DashboardProductRow = Record<string, unknown>;

export interface DashboardProductsListResult {
  products: DashboardProductRow[];
  total_count: number;
}

@Injectable()
export class DashboardProductsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listProducts(
    user: DashboardUserContext,
    options: {
      isActive?: boolean;
      limit?: number;
      offset?: number;
      search?: string;
    },
  ): Promise<DashboardProductsListResult> {
    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_products' as never,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_is_active: options.isActive,
        p_limit: options.limit ?? 15,
        p_offset: options.offset ?? 0,
        p_environment: user.environment,
        p_search: options.search ?? null,
      } as never,
    );

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as DashboardProductRow[];
    const totalCount =
      rows.length > 0 ? Number(rows[0]?.['total_count'] ?? 0) : 0;

    return { products: rows, total_count: totalCount };
  }
}
