import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

/**
 * Line item for multi-product checkout
 * Each line item represents one product with its quantity
 */
export class LineItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'Price ID for the product. The price contains product reference and amount.',
  })
  price_id: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of this product to purchase',
    default: 1,
    required: false,
  })
  quantity?: number;

  @ApiProperty({
    example: { variant: 'large', color: 'blue' },
    description: 'Optional metadata for this line item',
    required: false,
  })
  metadata?: Record<string, any>;
}

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: 10000.0,
    description:
      'Product subtotal (unit price × quantity, excluding fees). Optional if product_id is provided (defaults to catalog price). For standard prices: must match the configured price. For pay_what_you_want: unit amount must be within [minimum_amount, maximum_amount]; total = unit × quantity.',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    example: 'XOF',
    description: 'Currency code',
    enum: ['XOF', 'USD', 'EUR'],
  })
  currency_code: string;

  @ApiProperty({
    example: 'Premium Subscription',
    description: 'Title of the checkout session',
    required: false,
  })
  title?: string;

  @ApiProperty({
    example: 'Monthly subscription to premium features',
    description: 'Description of what the customer is buying',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Customer ID (if existing customer)',
    required: false,
  })
  customer_id?: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Customer email (required if no customer_id)',
    required: false,
  })
  customer_email?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Customer name',
    required: false,
  })
  customer_name?: string;

  @ApiProperty({
    example: '+221771234567',
    description: 'Customer phone number',
    required: false,
  })
  customer_phone?: string;

  @ApiProperty({
    example: 'Dakar',
    description: 'Customer city',
    required: false,
  })
  customer_city?: string;

  @ApiProperty({
    example: 'Senegal',
    description: 'Customer country',
    required: false,
  })
  customer_country?: string;

  @ApiProperty({
    example: '123 Main Street, Apt 4B',
    description: 'Customer address',
    required: false,
  })
  customer_address?: string;

  @ApiProperty({
    example: '12345',
    description: 'Customer postal code',
    required: false,
  })
  customer_postal_code?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'Product ID. When set with amount, pay_what_you_want bounds on the linked price are enforced.',
    required: false,
  })
  product_id?: string;

  @ApiProperty({
    example: '321e4567-e89b-12d3-a456-426614174000',
    description:
      'Specific price ID (if product has multiple prices). PWYW validation uses this price row minimum_amount and maximum_amount.',
    required: false,
  })
  price_id?: string;

  @ApiProperty({
    example: '654e7890-e89b-12d3-a456-426614174000',
    description: 'Subscription ID (if renewing/modifying subscription)',
    required: false,
  })
  subscription_id?: string;

  @ApiProperty({
    example: true,
    description: 'Allow customer to change quantity',
    default: false,
    required: false,
  })
  allow_quantity?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Quantity',
    default: 1,
    required: false,
  })
  quantity?: number;

  @ApiProperty({
    example: 'https://example.com/success',
    description: 'URL to redirect to on successful payment',
    required: false,
  })
  success_url?: string;

  @ApiProperty({
    example: 'https://example.com/cancel',
    description: 'URL to redirect to if payment is cancelled',
    required: false,
  })
  cancel_url?: string;

  @ApiProperty({
    example: true,
    description: 'Allow customer to apply discount codes',
    default: false,
    required: false,
  })
  allow_coupon_code?: boolean;

  @ApiProperty({
    example: false,
    description: 'Require billing address',
    default: false,
    required: false,
  })
  require_billing_address?: boolean;

  @ApiProperty({
    example: '987e6543-e89b-12d3-a456-426614174000',
    description: 'Payment link ID (if creating from payment link)',
    required: false,
  })
  payment_link_id?: string;

  @ApiProperty({
    example: 'woocommerce',
    description:
      'Sales channel that created this checkout session. Used for revenue attribution.',
    enum: [
      'system',
      'shopify',
      'woocommerce',
      'prestashop',
      'magento',
      'odoo',
      'bubble',
    ],
    required: false,
  })
  @IsOptional()
  @IsIn([
    'system',
    'shopify',
    'woocommerce',
    'prestashop',
    'magento',
    'odoo',
    'bubble',
  ])
  integration_source?: string;

  @ApiProperty({
    example: { custom_field: 'value' },
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;

  /**
   * Line items for multi-product checkout.
   * When provided, product_id, price_id, and quantity are ignored.
   * Each line item must have a price_id (which contains product reference and amount).
   */
  @ApiProperty({
    type: () => LineItemDto,
    isArray: true,
    description: `Array of line items for multi-product checkout.
When line_items is provided:
- product_id, price_id, and quantity at the root level are ignored
- amount is auto-calculated from line items
- Each line item must have a price_id belonging to the organization
- Only one-time products with standard (non PWYW) pricing are supported
- Rejected combinations return HTTP 400 with codes:
  line_items_recurring_not_supported, line_items_pwyw_not_supported,
  line_items_usage_based_not_supported, line_items_mixed_product_types

Example:
{
  "currency_code": "XOF",
  "line_items": [
    { "price_id": "price_abc123", "quantity": 2 },
    { "price_id": "price_xyz789", "quantity": 1 }
  ],
  "success_url": "https://example.com/success"
}`,
    required: false,
    example: [
      { price_id: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
      { price_id: '987e6543-e89b-12d3-a456-426614174000', quantity: 1 },
    ],
  })
  line_items?: LineItemDto[];
}
