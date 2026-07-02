import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreatePriceDto } from './create-price.dto';

export class CreateProductDto {
  @ApiProperty({
    example: 'Premium Subscription',
    description: 'Product name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Access to all premium features',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'recurring',
    description: 'Product type',
    enum: ['one_time', 'recurring', 'usage_based'],
    default: 'one_time',
  })
  @IsIn(['one_time', 'recurring', 'usage_based'])
  product_type: string;

  @ApiPropertyOptional({
    example: ['https://example.com/image.png'],
    description: 'Product images URLs',
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to display on storefront',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  display_on_storefront?: boolean;

  @ApiProperty({
    type: CreatePriceDto,
    isArray: true,
    description: 'Product prices (at least one required)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceDto)
  prices: CreatePriceDto[];

  @ApiPropertyOptional({
    example: { category: 'subscription' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'Fee type IDs to apply',
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  fee_type_ids?: string[];

  @ApiPropertyOptional({
    example: 'pause',
    description: 'Action to take on failed payment (recurring products only)',
    enum: ['pause', 'cancel', 'continue'],
  })
  @IsIn(['pause', 'cancel', 'continue'])
  @IsOptional()
  failed_payment_action?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Day of month to charge (1-31, recurring products only)',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  charge_day?: number;

  @ApiPropertyOptional({
    example: 'initial',
    description: 'When to charge first payment (recurring products only)',
    enum: ['initial', 'non_initial', 'prorated'],
    default: 'initial',
  })
  @IsIn(['initial', 'non_initial', 'prorated'])
  @IsOptional()
  first_payment_type?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to enable trial period',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  trial_enabled?: boolean;

  @ApiPropertyOptional({
    example: 14,
    description: 'Trial period in days (required if trial_enabled is true)',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  trial_period_days?: number;

  @ApiPropertyOptional({
    example: 'sum',
    description: 'Usage aggregation method (usage_based products only)',
    enum: ['sum', 'max', 'last_during_period', 'last_ever'],
  })
  @IsIn(['sum', 'max', 'last_during_period', 'last_ever'])
  @IsOptional()
  usage_aggregation?: string;

  @ApiPropertyOptional({
    example: 'api_calls',
    description: 'Unit of usage measurement (usage_based products only)',
  })
  @IsString()
  @IsOptional()
  usage_unit?: string;

  @ApiPropertyOptional({
    example: 'api_calls',
    description:
      'Billable metric code for usage events (usage_based products only). Defaults to slugified product name.',
  })
  @IsString()
  @IsOptional()
  meter_code?: string;
}
