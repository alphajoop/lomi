import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiProperty({
    example: 10000.0,
    description: 'Amount to request',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: 'XOF',
    description:
      'Currency code. When omitted, uses the organization default_currency.',
    enum: ['XOF', 'USD', 'EUR'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['XOF', 'USD', 'EUR'])
  currency_code?: string;

  @ApiPropertyOptional({
    example: 'Invoice #INV-2024-001',
    description: 'Description of the payment request',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Customer ID',
  })
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Expiration date/time for the payment request',
  })
  @IsString()
  expiry_date: string;

  @ApiPropertyOptional({
    example: 'INV-2024-001',
    description: 'Payment reference (invoice number, order ID, etc.)',
  })
  @IsString()
  @IsOptional()
  payment_reference?: string;

  @ApiPropertyOptional({
    example: { invoice_id: 'INV-2024-001', customer_ref: 'CUST-123' },
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
