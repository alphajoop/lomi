import { ApiProperty } from '@nestjs/swagger';
import { CreatePriceDto } from './create-price.dto';

export class CreateProductDto {
  @ApiProperty({
    example: 'Premium Subscription',
    description: 'Product name',
  })
  name: string;

  @ApiProperty({
    example: 'Access to all premium features',
    description: 'Product description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'recurring',
    description: 'Product type',
    enum: ['one_time', 'recurring', 'usage_based'],
    default: 'one_time',
  })
  product_type: string;

  @ApiProperty({
    example: ['https://example.com/image.png'],
    description: 'Product images URLs',
    required: false,
    type: String,
    isArray: true,
  })
  images?: string[];

  @ApiProperty({
    example: true,
    description: 'Whether the product is active',
    default: true,
    required: false,
  })
  is_active?: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether to display on storefront',
    default: true,
    required: false,
  })
  display_on_storefront?: boolean;

  @ApiProperty({
    type: CreatePriceDto,
    isArray: true,
    description: 'Product prices (at least one required)',
  })
  prices: CreatePriceDto[];

  @ApiProperty({
    example: { category: 'subscription' },
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'Fee type IDs to apply',
    required: false,
  })
  fee_type_ids?: string[];

  @ApiProperty({
    example: 'pause',
    description: 'Action to take on failed payment (recurring products only)',
    enum: ['pause', 'cancel', 'continue'],
    required: false,
  })
  failed_payment_action?: string;

  @ApiProperty({
    example: 1,
    description: 'Day of month to charge (1-31, recurring products only)',
    required: false,
  })
  charge_day?: number;

  @ApiProperty({
    example: 'initial',
    description: 'When to charge first payment (recurring products only)',
    enum: ['initial', 'non_initial', 'prorated'],
    default: 'initial',
    required: false,
  })
  first_payment_type?: string;

  @ApiProperty({
    example: false,
    description: 'Whether to enable trial period',
    default: false,
    required: false,
  })
  trial_enabled?: boolean;

  @ApiProperty({
    example: 14,
    description: 'Trial period in days (required if trial_enabled is true)',
    required: false,
  })
  trial_period_days?: number;

  @ApiProperty({
    example: 'sum',
    description: 'Usage aggregation method (usage_based products only)',
    enum: ['sum', 'max', 'last_during_period', 'last_ever'],
    required: false,
  })
  usage_aggregation?: string;

  @ApiProperty({
    example: 'api_calls',
    description: 'Unit of usage measurement (usage_based products only)',
    required: false,
  })
  usage_unit?: string;

  @ApiProperty({
    example: 'api_calls',
    description:
      'Billable metric code for usage events (usage_based products only). Defaults to slugified product name.',
    required: false,
  })
  meter_code?: string;
}
