import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSwitchChargeDto {
  @ApiProperty({
    type: Number,
    example: 10000,
    description: 'Amount in XOF francs',
  })
  amount: number;

  @ApiPropertyOptional({ type: String, example: 'XOF', enum: ['XOF'] })
  currency_code?: string;

  @ApiProperty({ type: String, example: '4221941234569109' })
  pan: string;

  @ApiProperty({ type: String, example: '06/25', description: 'MM/YY or YYMM' })
  expiry: string;

  @ApiProperty({ type: String, example: '123' })
  cvv: string;

  @ApiPropertyOptional({
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  customer_id?: string;

  @ApiPropertyOptional({ type: String, example: 'john@example.com' })
  customer_email?: string;

  @ApiPropertyOptional({ type: String, example: 'John Doe' })
  customer_name?: string;

  @ApiPropertyOptional({ type: String, example: '+221771234567' })
  customer_phone?: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiPropertyOptional({ type: String })
  payment_reference?: string;

  @ApiPropertyOptional({ type: String })
  product_id?: string;

  @ApiPropertyOptional({ type: String })
  subscription_id?: string;

  @ApiPropertyOptional({ type: String })
  checkout_session_id?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  quantity?: number;

  @ApiPropertyOptional({ type: Object, additionalProperties: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: String, description: 'Customer IP for EComIp' })
  ecom_ip?: string;

  organizationId?: string;
  merchantId?: string;
}
