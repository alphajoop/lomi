import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { AuthContext } from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { CreateProductDto } from './dto/create-product.dto';
import { AddPriceDto } from './dto/add-price.dto';
import { Database } from '../../utils/types/api';

type Product = Database['public']['Tables']['products']['Row'];

@Injectable()
export class ProductsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * List all products for merchant's organization
   * Uses RPC: fetch_products
   */
  async findAll(
    user: AuthContext,
    isActive?: boolean,
    limit: number = 15,
    offset: number = 0,
  ) {
    const { data, error } = await this.supabase.getClient().rpc(
      'fetch_products' as any,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_is_active: isActive,
        p_limit: limit,
        p_offset: offset,
        p_environment: environmentFromAuth(user),
      } as any,
    );

    if (error) throw new Error(error.message);

    return data || [];
  }

  /**
   * Get single product by ID with prices
   * Uses RPC: get_product_api, get_product_prices_api, get_product_fees_api
   */
  async findOne(id: string, user: AuthContext) {
    const { data: productData, error: productError } = await this.supabase
      .getClient()
      .rpc(
        'get_product_api' as any,
        {
          p_product_id: id,
          p_organization_id: user.organizationId,
        } as any,
      );

    const product = (
      Array.isArray(productData) ? productData[0] : productData
    ) as Product | null;

    if (productError || !product) {
      throw new NotFoundException(
        `Product with ID ${id} not found or access denied`,
      );
    }

    const { data: pricesData, error: pricesError } = await this.supabase.rpc(
      'get_product_prices_api',
      {
        p_product_id: id,
        p_organization_id: user.organizationId,
      },
    );

    const prices = pricesError
      ? []
      : Array.isArray(pricesData)
        ? pricesData
        : pricesData
          ? [pricesData]
          : [];

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
    }

    const { data: feesData, error: feesError } = await this.supabase.rpc(
      'get_product_fees_api',
      {
        p_product_id: id,
        p_organization_id: user.organizationId,
      },
    );

    const fees = feesError
      ? []
      : Array.isArray(feesData)
        ? feesData
        : feesData
          ? [feesData]
          : [];

    if (feesError) {
      console.error('Error fetching fees:', feesError);
    }

    return {
      ...product,
      prices,
      fees,
    };
  }

  /**
   * Create product with prices
   * Uses RPC: create_product
   */
  async create(createProductDto: CreateProductDto, user: AuthContext) {
    const { data: productId, error } = await this.supabase.getClient().rpc(
      'create_product' as any,
      {
        p_merchant_id: user.merchantId,
        p_organization_id: user.organizationId,
        p_name: createProductDto.name,
        p_description: createProductDto.description || null,
        p_product_type: createProductDto.product_type || 'one_time',
        p_images: createProductDto.images || null,
        p_is_active: createProductDto.is_active ?? true,
        p_display_on_storefront: createProductDto.display_on_storefront ?? true,
        p_prices: createProductDto.prices,
        p_metadata: createProductDto.metadata || null,
        p_fee_type_ids: createProductDto.fee_type_ids || null,
        p_environment: environmentFromAuth(user),
        p_failed_payment_action: createProductDto.failed_payment_action || null,
        p_charge_day: createProductDto.charge_day || null,
        p_first_payment_type: createProductDto.first_payment_type || 'initial',
        p_trial_enabled: createProductDto.trial_enabled ?? false,
        p_trial_period_days: createProductDto.trial_period_days || null,
        p_usage_aggregation: createProductDto.usage_aggregation || null,
        p_usage_unit: createProductDto.usage_unit || null,
        p_meter_code: createProductDto.meter_code || null,
      } as any,
    );

    if (error) throw new Error(error.message);

    // Fetch the created product with all details using API function that bypasses RLS
    const { data: productData, error: fetchError } = await this.supabase
      .getClient()
      .rpc(
        'get_product_api' as any,
        {
          p_product_id: productId,
          p_organization_id: user.organizationId,
        } as any,
      );

    if (fetchError || !productData) {
      // Fallback to findOne if API function fails
      return this.findOne(productId, user);
    }

    const productArray = Array.isArray(productData)
      ? productData
      : [productData];
    if (productArray.length === 0) {
      return this.findOne(productId, user);
    }

    const product = productArray[0] as any;

    // Get associated prices using RPC function that bypasses RLS
    const { data: pricesData, error: pricesError } = await this.supabase.rpc(
      'get_product_prices_api',
      {
        p_product_id: productId,
        p_organization_id: user.organizationId,
      },
    );

    const prices = pricesError
      ? []
      : Array.isArray(pricesData)
        ? pricesData
        : [pricesData];

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
    }

    // Get associated fees using RPC function that bypasses RLS
    const { data: feesData, error: feesError } = await this.supabase.rpc(
      'get_product_fees_api',
      {
        p_product_id: productId,
        p_organization_id: user.organizationId,
      },
    );

    const fees = feesError
      ? []
      : Array.isArray(feesData)
        ? feesData
        : [feesData];

    if (feesError) {
      console.error('Error fetching fees:', feesError);
    }

    return {
      ...product,
      prices: prices || [],
      fees: fees || [],
    };
  }

  /**
   * Add a new price to an existing product
   * Uses RPC: create_price
   */
  async addPrice(
    productId: string,
    addPriceDto: AddPriceDto,
    user: AuthContext,
  ) {
    // First verify product ownership
    await this.findOne(productId, user);

    const { data: priceId, error } = await this.supabase.getClient().rpc(
      'create_price' as any,
      {
        p_product_id: productId,
        p_organization_id: user.organizationId,
        p_amount: addPriceDto.amount,
        p_currency_code: addPriceDto.currency_code,
        p_billing_interval: addPriceDto.billing_interval || null,
        p_pricing_model: addPriceDto.pricing_model || 'standard',
        p_minimum_amount: addPriceDto.minimum_amount || null,
        p_maximum_amount: addPriceDto.maximum_amount || null,
        p_is_default: addPriceDto.is_default ?? false,
        p_metadata: addPriceDto.metadata || null,
      } as any,
    );

    if (error) throw new Error(error.message);

    // Get the created price
    const { data: priceData, error: priceError } = await this.supabase
      .getClient()
      .rpc(
        'get_price_api' as any,
        {
          p_price_id: priceId,
          p_organization_id: user.organizationId,
        } as any,
      );

    const price = (Array.isArray(priceData) ? priceData[0] : priceData) as {
      product_id: string;
    } | null;

    if (priceError || !price) {
      throw new Error(priceError?.message ?? 'Price not found');
    }

    return price;
  }

  /**
   * Set a price as the default for a product
   * Uses RPC: set_default_price
   */
  async setDefaultPrice(productId: string, priceId: string, user: AuthContext) {
    // First verify product ownership
    await this.findOne(productId, user);

    // Verify price belongs to this product
    const { data: priceData, error: priceError } = await this.supabase
      .getClient()
      .rpc(
        'get_price_api' as any,
        {
          p_price_id: priceId,
          p_organization_id: user.organizationId,
        } as any,
      );

    const price = (Array.isArray(priceData) ? priceData[0] : priceData) as {
      product_id: string;
    } | null;

    if (priceError || !price || price.product_id !== productId) {
      throw new NotFoundException(
        `Price with ID ${priceId} not found for this product`,
      );
    }

    const { error } = await this.supabase.getClient().rpc(
      'set_default_price' as any,
      {
        p_price_id: priceId,
        p_product_id: productId,
      } as any,
    );

    if (error) throw new Error(error.message);

    // Return updated product with prices
    return this.findOne(productId, user);
  }
}
