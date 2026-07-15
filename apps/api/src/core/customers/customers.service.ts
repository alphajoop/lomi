import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import {
  isNetworkRequest,
  resolveNetworkMemberMerchantId,
  upsertNetworkCustomerMetadata,
} from '../common/network-context';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreatePortalLaunchSessionDto } from './dto/create-portal-launch-session.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Database } from '../../utils/types/api';

type Customer = Database['public']['Tables']['customers']['Row'];

@Injectable()
export class CustomersService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * List all customers for merchant's organization
   * Uses RPC: fetch_customers_with_status
   * Supports filtering by: search term, customer type, activity status
   */
  async findAll(
    user: AuthContext,
    searchTerm?: string,
    customerType?: 'business' | 'individual' | 'all',
    activityStatus?: 'active' | 'inactive' | 'all',
    page: number = 1,
    pageSize: number = 50,
  ) {
    const offset = (page - 1) * pageSize;

    if (isNetworkRequest(user)) {
      const { data, error } = await this.supabase.getClient().rpc(
        'fetch_network_customers_for_api' as any,
        {
          p_network_membership_id: user.networkMembershipId,
          p_search_term: searchTerm || null,
          p_customer_type: customerType || 'all',
          p_activity_status: activityStatus || 'all',
          p_offset: offset,
          p_limit: pageSize,
          p_environment: environmentFromAuth(user),
        } as any,
      );

      if (error) throw new Error(error.message);

      const customers = (data as any[]) ?? [];
      const totalCount =
        customers.length > 0 ? Number(customers[0].total_count) : 0;

      return {
        customers: customers.map((c) => this.formatCustomer(c)),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_customers_with_status' as any,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_search_term: searchTerm || null,
        p_customer_type: customerType || 'all',
        p_activity_status: activityStatus || 'all',
        p_offset: offset,
        p_limit: pageSize,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    const customers = data as any[];

    // Get total count from first record (if exists)
    const totalCount =
      customers.length > 0 ? Number(customers[0].total_count) : 0;

    return {
      customers: customers.map((c) =>
        this.formatCustomer({ ...c, organization_id: user.organizationId }),
      ),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Get single customer by ID
   * Uses RPC: get_customer_by_organization
   */
  async findOne(id: string, user: AuthContext) {
    if (isNetworkRequest(user)) {
      const { data, error } = await this.supabase.getClient().rpc(
        'get_network_customer_for_api' as any,
        {
          p_network_membership_id: user.networkMembershipId,
          p_customer_id: id,
          p_environment: environmentFromAuth(user),
        } as any,
      );

      if (error) throw new Error(error.message);

      const customer = (Array.isArray(data) ? data[0] : data) as Record<
        string,
        unknown
      > | null;

      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${id} not found or access denied`,
        );
      }

      return this.formatCustomer(customer);
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'get_customer_by_organization' as any,
      {
        p_customer_id: id,
        p_organization_id: user.organizationId,
      } as any,
    );

    if (error) {
      throw new Error(error.message);
    }

    const customer = (Array.isArray(data) ? data[0] : data) as Customer | null;

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${id} not found or access denied`,
      );
    }

    return this.formatCustomer(customer);
  }

  /**
   * Create a new customer
   * Uses RPC: create_customer
   */
  async create(createDto: CreateCustomerDto, user: AuthContext) {
    const ledgerMerchantId = isNetworkRequest(user)
      ? await resolveNetworkMemberMerchantId(this.supabase, user)
      : user.merchantId;

    const { data, error } = await this.supabase.getClient().rpc(
      'create_customer' as any,
      {
        p_merchant_id: ledgerMerchantId,
        p_organization_id: user.organizationId,
        p_name: createDto.name,
        p_email: createDto.email || null,
        p_phone_number: createDto.phone_number || null,
        p_whatsapp_number: createDto.whatsapp_number || null,
        p_country: createDto.country || '',
        p_city: createDto.city || '',
        p_address: createDto.address || '',
        p_postal_code: createDto.postal_code || '',
        p_is_business: createDto.is_business || false,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    // RPC returns customer_id
    const customerId = data as string;

    if (isNetworkRequest(user)) {
      const tagged = await upsertNetworkCustomerMetadata(
        this.supabase,
        user,
        customerId,
        createDto.metadata,
      );

      if (tagged) {
        return this.formatCustomer(tagged);
      }
    }

    // If metadata was provided, update it separately
    if (createDto.metadata) {
      const { error: metadataError } = await this.supabase.getClient().rpc(
        'update_customer_metadata' as any,
        {
          p_customer_id: customerId,
          p_organization_id: user.organizationId,
          p_metadata: createDto.metadata,
        } as any,
      );

      if (metadataError) {
        console.error('Failed to update customer metadata:', metadataError);
      }
    }

    // Fetch and return the created customer
    return this.findOne(customerId, user);
  }

  /**
   * Update an existing customer
   * Uses RPC: update_customer for basic fields, update_customer_metadata for metadata
   */
  async update(id: string, updateDto: UpdateCustomerDto, user: AuthContext) {
    // First verify ownership
    await this.findOne(id, user);

    // Extract metadata if provided
    const { metadata, ...basicFields } = updateDto;

    // Update basic fields using RPC if any are provided
    if (Object.keys(basicFields).length > 0) {
      // Fetch current customer data to fill in missing fields
      const current = await this.findOne(id, user);

      const { error } = await this.supabase.getClient().rpc(
        'update_customer' as any,
        {
          p_customer_id: id,
          p_name: updateDto.name || current.name,
          p_email:
            updateDto.email !== undefined ? updateDto.email : current.email,
          p_phone_number:
            updateDto.phone_number !== undefined
              ? updateDto.phone_number
              : current.phone_number,
          p_whatsapp_number:
            updateDto.whatsapp_number !== undefined
              ? updateDto.whatsapp_number
              : current.whatsapp_number,
          p_country:
            updateDto.country !== undefined
              ? updateDto.country
              : current.country || '',
          p_city:
            updateDto.city !== undefined ? updateDto.city : current.city || '',
          p_address:
            updateDto.address !== undefined
              ? updateDto.address
              : current.address || '',
          p_postal_code:
            updateDto.postal_code !== undefined
              ? updateDto.postal_code
              : current.postal_code || '',
          p_is_business:
            updateDto.is_business !== undefined
              ? updateDto.is_business
              : current.is_business,
        } as any,
      );

      if (error) throw new Error(error.message);
    }

    if (isNetworkRequest(user)) {
      const tagged = await upsertNetworkCustomerMetadata(
        this.supabase,
        user,
        id,
        metadata,
      );

      if (tagged) {
        return this.formatCustomer(tagged);
      }
    } else if (metadata !== undefined) {
      const { error: metadataError } = await this.supabase.getClient().rpc(
        'update_customer_metadata' as any,
        {
          p_customer_id: id,
          p_organization_id: user.organizationId,
          p_metadata: metadata,
        } as any,
      );

      if (metadataError) throw new Error(metadataError.message);
    }

    // Return updated customer
    return this.findOne(id, user);
  }

  /**
   * Soft delete a customer
   * Uses RPC: delete_customer
   */
  async remove(id: string, user: AuthContext) {
    // First verify ownership
    await this.findOne(id, user);

    const { error } = await this.supabase.getClient().rpc(
      'delete_customer' as any,
      {
        p_customer_id: id,
      } as any,
    );

    if (error) throw new Error(error.message);

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Get customer transactions
   * Uses RPC: fetch_customer_transactions
   */
  async getTransactions(id: string, user: AuthContext) {
    // First verify ownership
    await this.findOne(id, user);

    if (isNetworkRequest(user)) {
      const { data, error } = await this.supabase.getClient().rpc(
        'fetch_network_customer_transactions_for_api' as any,
        {
          p_network_membership_id: user.networkMembershipId,
          p_customer_id: id,
          p_environment: environmentFromAuth(user),
        } as any,
      );

      if (error) throw new Error(error.message);

      return data || [];
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_customer_transactions' as any,
      {
        p_customer_id: id,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    return data || [];
  }

  /**
   * Create a one-time hosted customer portal launch session for a customer.
   * This is intended to be called from merchant-owned apps via API key auth.
   */
  async createPortalLaunchSession(
    id: string,
    input: CreatePortalLaunchSessionDto,
    user: AuthContext,
  ) {
    // First verify customer ownership in the merchant organization.
    await this.findOne(id, user);

    const normalizedFlowType = input.flow_type ?? 'portal_home';
    const { data, error } = await this.supabase.getClient().rpc(
      'create_customer_portal_launch_session' as any,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_customer_id: id,
        p_environment: user.environment || 'live',
        p_return_url: input.return_url || null,
        p_flow_type: normalizedFlowType,
        p_flow_subscription_id: input.flow_subscription_id || null,
        p_flow_after_completion_url: input.flow_after_completion_url || null,
      } as any,
    );

    if (error) throw new Error(error.message);

    const row = (Array.isArray(data) ? data[0] : data) as
      { launch_token?: string } | null | undefined;
    const launchToken = row?.launch_token;

    if (!launchToken) {
      throw new Error('Failed to create portal launch token');
    }

    const launchUrl = `https://customers.lomi.africa/launch?token=${encodeURIComponent(launchToken)}`;

    return {
      customer_id: id,
      organization_id: user.organizationId,
      launch_token: launchToken,
      launch_url: launchUrl,
      expires_in_seconds: 900,
      flow_type: normalizedFlowType,
      flow_subscription_id: input.flow_subscription_id || null,
      return_url: input.return_url || null,
      flow_after_completion_url: input.flow_after_completion_url || null,
    };
  }

  /**
   * Merchant-scoped hosted customer portal audit events (challenge, session, subscription actions).
   */
  async getPortalAudit(
    id: string,
    user: AuthContext,
    page: number = 1,
    pageSize: number = 50,
    eventType?: string,
  ) {
    await this.findOne(id, user);
    const limit = Math.min(Math.max(pageSize, 1), 200);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * limit;

    const { data, error } = await this.supabase.getClient().rpc(
      'merchant_list_customer_portal_audit_events' as any,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_customer_id: id,
        p_limit: limit,
        p_offset: offset,
        p_event_type: eventType?.trim() || null,
      } as any,
    );

    if (error) throw new Error(error.message);

    const rows = (data as any[]) ?? [];
    const total = rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0;

    return {
      events: rows.map(({ total_count: _tc, ...rest }) => rest),
      pagination: {
        page: safePage,
        pageSize: limit,
        totalCount: total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  private formatCustomer(row: any) {
    return {
      customer_id: row.customer_id,
      organization_id: row.organization_id,
      name: row.name,
      email: row.email,
      phone_number: row.phone_number,
      whatsapp_number: row.whatsapp_number,
      country: row.country,
      city: row.city,
      address: row.address,
      postal_code: row.postal_code,
      is_business: row.is_business,
      metadata: row.metadata ?? null,
      environment: row.environment,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
