import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export class AddPriceDto {
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

  @ApiProperty({
    example: 'month',
    description: 'Billing interval (must match product type)',
    enum: ['day', 'week', 'month', 'year'],
    required: false,
  })
  @IsIn(['day', 'week', 'month', 'year'])
  @IsOptional()
  billing_interval?: string;

  @ApiProperty({
    example: 'standard',
    description: 'Pricing model',
    enum: ['standard', 'pay_what_you_want', 'tiered'],
    default: 'standard',
    required: false,
  })
  @IsIn(['standard', 'pay_what_you_want', 'tiered'])
  @IsOptional()
  pricing_model?: string;

  @ApiProperty({
    example: 5000.0,
    description:
      'Lowest unit price the customer may pay. Required when pricing_model is pay_what_you_want.',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimum_amount?: number;

  @ApiProperty({
    example: 50000.0,
    description:
      'Optional upper bound on unit price when pricing_model is pay_what_you_want.',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maximum_amount?: number;

  @ApiProperty({
    example: false,
    description: 'Whether to set as default price',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @ApiProperty({
    example: { notes: 'Holiday special pricing' },
    description: 'Additional metadata',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
