import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { OrganizationMetricsResponseDto } from './dto/organization-metrics-response.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Get organization details for the current merchant
   * Uses RPC: list_organizations
   * Note: Merchants can only access their own organization
   */
  async findAll(user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'list_organizations' as any,
      {
        p_organization_id: user.organizationId,
      } as any,
    );

    if (error) {
      this.logger.error('list_organizations RPC error:', error);
      throw new InternalServerErrorException(
        `Failed to fetch organizations: ${error.message}`,
      );
    }
    return (data as any[]) || [];
  }

  /**
   * Get single organization by ID
   * Must match the authenticated merchant's organization
   */
  async findOne(id: string, user: AuthContext) {
    // Ensure merchant can only access their own organization
    if (id !== user.organizationId) {
      throw new NotFoundException('Organization not found or access denied');
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'list_organizations' as any,
      {
        p_organization_id: id,
      } as any,
    );

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Organization with ID ${id} not found`);
      }
      throw new Error(error.message);
    }

    const dataArray = (data as any[]) || [];
    if (dataArray.length === 0) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return dataArray[0];
  }

  /**
   * Get comprehensive organization metrics
   * Uses: fetch_organization_details(p_merchant_id, p_organization_id)
   * Returns: Full organization details including metrics
   * Note: Metrics (MRR, ARR) are pre-calculated in the database
   * LTV is excluded as it's an admin-only metric
   */
  async getMetrics(user: AuthContext): Promise<OrganizationMetricsResponseDto> {
    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_organization_details' as any,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
      } as any,
    );

    if (error) throw new Error(error.message);

    const results = (data as any[]) || [];

    // Check if organization exists
    if (results.length === 0) {
      throw new NotFoundException(
        'Organization not found. Please contact support if this error persists.',
      );
    }

    const result = results[0];

    // Ensure merchant is accessing their own organization
    if (result.organization_id !== user.organizationId) {
      throw new NotFoundException('Organization not found or access denied');
    }

    // Transform the response to match our DTO (excluding LTV - admin metric)
    return {
      mrr: result?.mrr || 0,
      arr: result?.arr || 0,
      total_revenue: result?.total_revenue || 0,
      total_transactions: result?.total_transactions || 0,
      total_customers: result?.total_customers || 0,
      currency_code: result?.default_currency || 'XOF',
      calculated_at: result?.updated_at || new Date().toISOString(),
    };
  }
}
