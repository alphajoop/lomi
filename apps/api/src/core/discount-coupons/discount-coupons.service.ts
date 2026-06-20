import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { CreateDiscountCouponDto } from './dto/create-discount-coupon.dto';

@Injectable()
export class DiscountCouponsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * List all discount coupons for merchant's organization
   * Uses RPC: get_organization_coupons
   */
  async findAll(user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_organization_coupons' as any,
      {
        p_organization_id: user.organizationId,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    return data || [];
  }

  /**
   * Get single discount coupon by ID
   * Uses RPC: get_coupon_details_for_management
   */
  async findOne(id: string, user: AuthContext) {
    const { data, error } = await this.supabase.getClient().rpc(
      'get_coupon_details_for_management' as any,
      {
        p_organization_id: user.organizationId,
        p_coupon_id: id,
        p_merchant_id: user.merchantId,
      } as any,
    );

    if (error) {
      throw new Error(error.message);
    }

    // RPC functions that return TABLE return an array
    const results = Array.isArray(data) ? data : data ? [data] : [];
    const coupon = results[0] as any;

    if (!coupon || !coupon.coupon_id) {
      throw new NotFoundException(
        `Discount coupon with ID ${id} not found or access denied`,
      );
    }

    // Validate ownership
    if (coupon.organization_id !== user.organizationId) {
      throw new NotFoundException(
        `Discount coupon with ID ${id} not found or access denied`,
      );
    }

    return coupon;
  }

  /**
   * Create a new discount coupon
   * Uses RPC: create_discount_coupon
   */
  async create(createDto: CreateDiscountCouponDto, user: AuthContext) {
    // Validate discount type and amount
    if (createDto.discount_type === 'percentage') {
      if (!createDto.discount_percentage) {
        throw new BadRequestException(
          'discount_percentage is required when discount_type is percentage',
        );
      }
      if (
        createDto.discount_percentage <= 0 ||
        createDto.discount_percentage > 100
      ) {
        throw new BadRequestException(
          'discount_percentage must be between 0 and 100',
        );
      }
    } else if (createDto.discount_type === 'fixed') {
      if (!createDto.discount_fixed_amount) {
        throw new BadRequestException(
          'discount_fixed_amount is required when discount_type is fixed',
        );
      }
      if (createDto.discount_fixed_amount <= 0) {
        throw new BadRequestException('discount_fixed_amount must be positive');
      }
    }

    // Validate usage_frequency_limit
    if (
      createDto.usage_frequency_limit &&
      createDto.usage_frequency_limit !== 'total'
    ) {
      if (!createDto.usage_limit_value) {
        throw new BadRequestException(
          'usage_limit_value is required when usage_frequency_limit is not "total"',
        );
      }
      if (createDto.usage_limit_value <= 0) {
        throw new BadRequestException('usage_limit_value must be positive');
      }
    }

    // Validate dates
    if (createDto.valid_from && createDto.expires_at) {
      const validFrom = new Date(createDto.valid_from);
      const expiresAt = new Date(createDto.expires_at);
      if (validFrom >= expiresAt) {
        throw new BadRequestException('valid_from must be before expires_at');
      }
    }

    const { data, error } = await this.supabase.getClient().rpc(
      'create_discount_coupon' as any,
      {
        p_organization_id: user.organizationId,
        p_code: createDto.code.toUpperCase(), // Uppercase the code
        p_discount_type: createDto.discount_type || 'percentage',
        p_discount_percentage: createDto.discount_percentage || null,
        p_discount_fixed_amount: createDto.discount_fixed_amount || null,
        p_customer_type: createDto.customer_type || 'all',
        p_usage_frequency_limit: createDto.usage_frequency_limit || 'total',
        p_usage_limit_value: createDto.usage_limit_value || null,
        p_description: createDto.description || null,
        p_is_active:
          createDto.is_active !== undefined ? createDto.is_active : true,
        p_max_uses: createDto.max_uses || null,
        p_max_quantity_per_use: createDto.max_quantity_per_use || null,
        p_valid_from: createDto.valid_from || null,
        p_expires_at: createDto.expires_at || null,
        p_scope_type: createDto.scope_type || 'organization_wide',
        p_product_ids: createDto.product_ids || null,
        p_environment: environmentFromAuth(user),
        p_merchant_id: user.merchantId, // Pass merchant_id for API key authentication
      } as any,
    );

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        throw new BadRequestException(
          `A coupon with code "${createDto.code.toUpperCase()}" already exists`,
        );
      }
      throw new Error(error.message);
    }

    // RPC returns coupon_id
    const couponId = data as string;

    if (!couponId) {
      throw new Error(
        'Failed to create discount coupon: No coupon_id returned',
      );
    }

    // Small delay to ensure the coupon is available for retrieval
    // This handles potential race conditions with RLS or database replication
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Fetch and return the created coupon
    return this.findOne(couponId, user);
  }

  /**
   * Get coupon performance metrics
   * Uses RPC: get_coupon_performance
   */
  async getPerformance(id: string, user: AuthContext) {
    // First verify ownership
    await this.findOne(id, user);

    const { data, error } = await this.supabase.getClient().rpc(
      'get_coupon_performance' as any,
      {
        p_coupon_id: id,
      } as any,
    );

    if (error) throw new Error(error.message);

    return data || {};
  }
}
