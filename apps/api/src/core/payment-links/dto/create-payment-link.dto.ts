import { ApiProperty } from '@nestjs/swagger';
import type { UnifiedCheckoutFieldDefinition } from '../../../utils/checkout/resolve-checkout-form';

export class CreatePaymentLinkDto {
  @ApiProperty({
    example: 'product',
    description: 'Type of payment link',
    enum: ['product', 'instant'],
  })
  link_type: string;

  @ApiProperty({
    example: 'Premium Subscription',
    description: 'Title of the payment link',
  })
  title: string;

  @ApiProperty({
    example: 'XOF',
    description: 'Currency code',
    enum: ['XOF', 'USD', 'EUR'],
  })
  currency_code: string;

  @ApiProperty({
    example: 'Monthly subscription to premium features',
    description: 'Description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 10000.0,
    description:
      'Amount (required for instant links, not allowed for product links)',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'Product ID (required for product links, not allowed for instant links)',
    required: false,
  })
  product_id?: string;

  @ApiProperty({
    example: '321e4567-e89b-12d3-a456-426614174000',
    description:
      'Specific price ID (optional, for product links with multiple prices)',
    required: false,
  })
  price_id?: string;

  @ApiProperty({
    example: true,
    description: 'Allow customers to apply discount codes',
    default: false,
    required: false,
  })
  allow_coupon_code?: boolean;

  @ApiProperty({
    example: false,
    description: 'Allow customers to change quantity',
    default: false,
    required: false,
  })
  allow_quantity?: boolean;

  @ApiProperty({
    example: true,
    description: 'Require billing address',
    default: true,
    required: false,
  })
  require_billing_address?: boolean;

  @ApiProperty({
    example: true,
    description: 'Require customer email at checkout',
    default: true,
    required: false,
  })
  require_email?: boolean;

  @ApiProperty({
    example: false,
    description: 'Require customer phone at checkout',
    default: false,
    required: false,
  })
  require_phone?: boolean;

  @ApiProperty({
    description:
      'Optional unified checkout field schema. When provided, overrides require_* booleans.',
    required: false,
    type: 'array',
    items: { type: 'object' },
  })
  fields?: UnifiedCheckoutFieldDefinition[];

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Expiration date/time (optional)',
    required: false,
  })
  expires_at?: string;

  @ApiProperty({
    example: 'https://example.com/success',
    description: 'Success redirect URL',
    required: false,
  })
  success_url?: string;

  @ApiProperty({
    example: 'https://example.com/cancel',
    description: 'Cancel redirect URL',
    required: false,
  })
  cancel_url?: string;

  @ApiProperty({
    example: { campaign: 'summer2024' },
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;
}
