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
import { InvoiceLineItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @ApiProperty({ example: '2026-06-30', required: false })
  @IsString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({
    example: 'sent',
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    required: false,
  })
  @IsIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Updated invoice note', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 10000, required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ example: 10000, required: false })
  @IsNumber()
  @IsOptional()
  amount_due?: number;

  @ApiProperty({ type: [InvoiceLineItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsOptional()
  line_items?: InvoiceLineItemDto[];

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  customer_id?: string;

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

  @ApiProperty({ required: false, additionalProperties: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
