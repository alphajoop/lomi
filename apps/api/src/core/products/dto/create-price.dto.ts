import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export class CreatePriceDto {
  @ApiProperty({
    example: 10000.0,
    description:
      'Price amount. For standard/tiered: fixed unit price. For pay_what_you_want: suggested unit price pre-filled at checkout (defaults to minimum_amount if omitted).',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: 'XOF',
    description: 'Currency code',
    enum: ['XOF', 'USD', 'EUR'],
  })
  @IsIn(['XOF', 'USD', 'EUR'])
  currency_code: string;

  @ApiPropertyOptional({
    example: 'month',
    description: 'Billing interval (required for recurring products)',
    enum: ['day', 'week', 'month', 'year'],
  })
  @IsIn(['day', 'week', 'month', 'year'])
  @IsOptional()
  billing_interval?: string;

  @ApiPropertyOptional({
    example: 'standard',
    description: 'Pricing model',
    enum: ['standard', 'pay_what_you_want', 'tiered'],
    default: 'standard',
  })
  @IsIn(['standard', 'pay_what_you_want', 'tiered'])
  @IsOptional()
  pricing_model?: string;

  @ApiPropertyOptional({
    example: 5000.0,
    description:
      'Lowest unit price the customer may pay. Required when pricing_model is pay_what_you_want.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimum_amount?: number;

  @ApiPropertyOptional({
    example: 50000.0,
    description:
      'Optional upper bound on unit price when pricing_model is pay_what_you_want.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximum_amount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is the default price',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @ApiPropertyOptional({
    example: { notes: 'Early bird pricing' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
