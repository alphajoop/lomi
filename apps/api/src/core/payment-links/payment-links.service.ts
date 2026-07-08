import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { LinkType, CurrencyCode } from '../../utils/types/api';
import { normalizeCheckoutFieldFlags } from '../../utils/checkout/resolve-checkout-form';

@Injectable()
export class PaymentLinksService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Create a payment link
   * Uses RPC: create_payment_link
   */
  async create(createDto: CreatePaymentLinkDto, user: AuthContext) {
    const contactFlags = normalizeCheckoutFieldFlags({
      require_billing_address: createDto.require_billing_address,
      require_email: createDto.require_email,
      require_phone: createDto.require_phone,
      require_name: createDto.require_name,
      fields: createDto.fields,
    });

    const { data, error } = await this.supabase.rpc('create_payment_link', {
      p_organization_id: user.organizationId,
      p_link_type: createDto.link_type as LinkType,
      p_title: createDto.title,
      p_currency_code: createDto.currency_code as CurrencyCode,
      p_description: createDto.description || null,
      p_price: createDto.amount || null,
      p_allow_coupon_code: createDto.allow_coupon_code ?? false,
      p_allow_quantity: createDto.allow_quantity ?? false,
      p_require_billing_address: contactFlags.require_billing_address ?? false,
      p_require_email: contactFlags.require_email ?? true,
      p_require_phone: contactFlags.require_phone ?? true,
      p_require_name: contactFlags.require_name ?? true,
      p_expires_at: createDto.expires_at || null,
      p_success_url: createDto.success_url || null,
      p_cancel_url: createDto.cancel_url || null,
      p_product_id: createDto.product_id || null,
      p_price_id: createDto.price_id || null,
      p_created_by: user.merchantId,
      p_environment: environmentFromAuth(user),
      p_metadata: createDto.metadata ?? null,
    } as never);

    if (error) throw new Error(error.message);

    if (!data) {
      throw new Error('Failed to create payment link');
    }

    // Fetch the created link using API function that bypasses RLS
    const { data: linkData, error: fetchError } = await this.supabase
      .getClient()
      .rpc(
        'get_payment_link_api' as any,
        {
          p_link_id: data,
          p_organization_id: user.organizationId,
        } as any,
      );

    if (fetchError || !linkData) {
      // Fallback to findOne if API function fails
      return this.findOne(data, user);
    }

    const linkArray = Array.isArray(linkData) ? linkData : [linkData];
    if (linkArray.length === 0) {
      return this.findOne(data, user);
    }

    return linkArray[0];
  }

  /**
   * List all payment links with filtering
   * Uses RPC: list_payment_links
   */
  async findAll(
    user: AuthContext,
    linkType?: string,
    isActive?: boolean,
    limit: number = 20,
    offset: number = 0,
  ) {
    const { data, error } = await this.supabase.getClient().rpc(
      'list_payment_links' as any,
      {
        p_organization_id: user.organizationId,
        p_link_type: linkType || null,
        p_is_active: isActive !== undefined ? isActive : null,
        p_limit: limit,
        p_offset: offset,
      } as any,
    );

    if (error) throw new Error(error.message);

    const links = (data as any[]) || [];

    return {
      data: links,
      total: links.length, // RPC doesn't return count, approximate with length
      limit,
      offset,
    };
  }

  /**
   * Get single payment link by ID
   */
  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_payment_link_api' as any,
      {
        p_link_id: id,
        p_organization_id: user.organizationId,
      } as any,
    );

    const dataArray = Array.isArray(data) ? data : [data];
    const link = dataArray[0];

    if (error || !link) {
      throw new NotFoundException(
        `Payment link with ID ${id} not found or access denied`,
      );
    }

    return link;
  }
}
