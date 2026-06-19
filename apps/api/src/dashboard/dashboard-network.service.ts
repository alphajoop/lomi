import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import type { DashboardUserContext } from './decorators/dashboard-user.decorator';

@Injectable()
export class DashboardNetworkService {
  constructor(private readonly supabase: SupabaseService) {}

  private userClient(user: DashboardUserContext) {
    return this.supabase.getUserClient(user.accessToken);
  }

  async getContext(user: DashboardUserContext) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_organization_context' as never,
      { p_organization_id: user.organizationId } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: (data ?? [])[0] ?? null };
  }

  async listMembers(
    user: DashboardUserContext,
    options: {
      status?: string[] | null;
      search?: string | null;
      limit?: number;
      offset?: number;
    },
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_members' as never,
      {
        p_operator_organization_id: user.organizationId,
        p_status: options.status ?? null,
        p_search_term: options.search ?? null,
        p_limit: options.limit ?? 50,
        p_offset: options.offset ?? 0,
      } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }

  async listEnrollments(
    user: DashboardUserContext,
    options: { status?: string[] | null; limit?: number; offset?: number },
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_enrollments' as never,
      {
        p_operator_organization_id: user.organizationId,
        p_status: options.status ?? null,
        p_limit: options.limit ?? 50,
        p_offset: options.offset ?? 0,
      } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }

  async listTransactions(
    user: DashboardUserContext,
    options: {
      memberOrganizationId?: string | null;
      limit?: number;
      offset?: number;
    },
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_transactions' as never,
      {
        p_operator_organization_id: user.organizationId,
        p_member_organization_id: options.memberOrganizationId ?? null,
        p_limit: options.limit ?? 50,
        p_offset: options.offset ?? 0,
      } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }

  async listFeeEntries(user: DashboardUserContext, limit = 50, offset = 0) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_operator_fee_entries' as never,
      {
        p_operator_organization_id: user.organizationId,
        p_limit: limit,
        p_offset: offset,
      } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }

  async listFeeRules(user: DashboardUserContext) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_operator_fee_rules' as never,
      { p_operator_organization_id: user.organizationId } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }

  async listCustomers(
    user: DashboardUserContext,
    options: {
      search?: string | null;
      memberOrganizationId?: string | null;
      page?: number;
      pageSize?: number;
    },
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'fetch_network_customers' as never,
      {
        p_operator_organization_id: user.organizationId,
        p_search_term: options.search ?? null,
        p_member_organization_id: options.memberOrganizationId ?? null,
        p_page: options.page ?? 1,
        p_page_size: options.pageSize ?? 50,
        p_environment: user.environment,
      } as never,
    );
    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }

  async createEnrollment(
    user: DashboardUserContext,
    body: {
      intended_email?: string | null;
      requested_capabilities?: string[];
      expires_at?: string | null;
      terms_version?: string | null;
    },
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'create_network_enrollment_session' as never,
      {
        p_operator_organization_id: user.organizationId,
        p_created_by: user.merchantId,
        p_intended_email: body.intended_email ?? null,
        p_requested_capabilities: body.requested_capabilities ?? [],
        p_expires_at: body.expires_at ?? null,
        p_terms_version: body.terms_version ?? null,
        p_metadata: {},
      } as never,
    );
    if (error) throw new BadRequestException(error.message);
    return { data: (data ?? [])[0] ?? null };
  }

  async updateMembershipStatus(
    user: DashboardUserContext,
    membershipId: string,
    status: string,
    metadata?: Record<string, unknown>,
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'set_network_membership_status' as never,
      {
        p_network_membership_id: membershipId,
        p_status: status,
        p_actor_merchant_id: user.merchantId,
        p_metadata: metadata ?? {},
      } as never,
    );
    if (error) throw new BadRequestException(error.message);
    return { data: { updated: Boolean(data) } };
  }

  async setCapabilityGrant(
    user: DashboardUserContext,
    membershipId: string,
    body: {
      capability_key: string;
      environment: string;
      status?: string;
    },
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'set_network_capability_grant' as never,
      {
        p_network_membership_id: membershipId,
        p_capability_key: body.capability_key,
        p_environment: body.environment,
        p_status: body.status ?? 'active',
        p_granted_by: user.merchantId,
        p_metadata: {},
      } as never,
    );
    if (error) throw new BadRequestException(error.message);
    return { data: { grant_id: data } };
  }

  async upsertFeeRule(
    user: DashboardUserContext,
    body: Record<string, unknown>,
  ) {
    const { data, error } = await this.userClient(user).rpc(
      'upsert_network_operator_fee_rule',
      {
        p_operator_organization_id: user.organizationId,
        p_fee_rule_id: body.fee_rule_id ?? null,
        p_name: body.name,
        p_status: body.status ?? 'active',
        p_fee_type: body.fee_type,
        p_percentage: body.percentage ?? null,
        p_priority: body.priority ?? 0,
        p_currency_code: body.currency_code ?? 'XOF',
        p_fixed_amount: body.fixed_amount ?? null,
        p_minimum_amount: body.minimum_amount ?? null,
        p_metadata: body.metadata ?? {},
      } as never,
    );
    if (error) throw new BadRequestException(error.message);
    return { data };
  }
}
