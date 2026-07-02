import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import type { UnifiedCheckoutFieldDefinition } from '../../../utils/checkout/resolve-checkout-form';

class CheckoutFieldDefinitionDto {
  @IsString()
  key: string;

  @IsString()
  type: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class CreatePaymentLinkDto {
  @ApiProperty({
    example: 'product',
    description: 'Type of payment link',
    enum: ['product', 'instant'],
  })
  @IsIn(['product', 'instant'])
  link_type: string;

  @ApiProperty({
    example: 'Premium Subscription',
    description: 'Title of the payment link',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'XOF',
    description: 'Currency code',
    enum: ['XOF', 'USD', 'EUR'],
  })
  @IsIn(['XOF', 'USD', 'EUR'])
  currency_code: string;

  @ApiPropertyOptional({
    example: 'Monthly subscription to premium features',
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 10000.0,
    description:
      'Amount (required for instant links, not allowed for product links)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'Product ID (required for product links, not allowed for instant links)',
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiPropertyOptional({
    example: '321e4567-e89b-12d3-a456-426614174000',
    description:
      'Specific price ID (optional, for product links with multiple prices)',
  })
  @IsUUID()
  @IsOptional()
  price_id?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow customers to apply discount codes',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allow_coupon_code?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Allow customers to change quantity',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allow_quantity?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Require billing address',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  require_billing_address?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Require customer email at checkout',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  require_email?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Require customer phone at checkout',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  require_phone?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Require customer name at checkout',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  require_name?: boolean;

  @ApiPropertyOptional({
    description:
      'Optional unified checkout field schema. When provided, overrides require_* booleans.',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutFieldDefinitionDto)
  @IsOptional()
  fields?: UnifiedCheckoutFieldDefinition[];

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Expiration date/time (optional)',
  })
  @IsString()
  @IsOptional()
  expires_at?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/success',
    description: 'Success redirect URL',
  })
  @IsUrl()
  @IsOptional()
  success_url?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cancel',
    description: 'Cancel redirect URL',
  })
  @IsUrl()
  @IsOptional()
  cancel_url?: string;

  @ApiPropertyOptional({
    example: { campaign: 'summer2024' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
