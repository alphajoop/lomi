import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class InvoiceLineItemDto {
  @ApiProperty({ example: 'Monthly service', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Monthly service', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  unit_price?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiProperty({
    example: '321e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  price_id?: string;

  @ApiProperty({ required: false, additionalProperties: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ example: 'XOF', enum: ['XOF', 'USD', 'EUR'], default: 'XOF' })
  @IsIn(['XOF', 'USD', 'EUR'])
  @IsOptional()
  currency_code?: string;

  @ApiProperty({ example: '2026-06-30', required: false })
  @IsString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({
    example: 'manual',
    enum: [
      'manual',
      'one_time_product',
      'recurring_subscription',
      'usage_billing',
      'failed_renewal',
    ],
    required: false,
  })
  @IsIn([
    'manual',
    'one_time_product',
    'recurring_subscription',
    'usage_billing',
    'failed_renewal',
  ])
  @IsOptional()
  origin?: string;

  @ApiProperty({ example: 'INV-2026-0001', required: false })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiProperty({ example: 'Consulting services', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiProperty({
    example: '321e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  price_id?: string;

  @ApiProperty({
    example: '654e7890-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  subscription_id?: string;

  @ApiProperty({ type: [InvoiceLineItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsOptional()
  line_items?: InvoiceLineItemDto[];

  @ApiProperty({ required: false, additionalProperties: true })
  @IsObject()
  @IsOptional()
  customer_details?: Record<string, unknown>;

  @ApiProperty({ required: false, additionalProperties: true })
  @IsObject()
  @IsOptional()
  payment_details?: Record<string, unknown>;

  @ApiProperty({ required: false, additionalProperties: true })
  @IsObject()
  @IsOptional()
  template?: Record<string, unknown>;

  @ApiProperty({ required: false, additionalProperties: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
