import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Explicit `type` on each field avoids bad inferred metadata from prototype keys. */
export class MerchantResponseDto {
  @ApiProperty({
    example: '904d003c-3736-41d4-90a5-9de74d404fd7',
    type: String,
  })
  merchant_id: string;

  @ApiProperty({ example: 'Test Merchant', type: String })
  name: string;

  @ApiProperty({ example: 'merchant@example.com', type: String })
  email: string;

  @ApiPropertyOptional({ example: '+123456789', type: String })
  phone_number?: string | null;

  @ApiPropertyOptional({ example: 'SN', type: String })
  country?: string | null;

  @ApiProperty({
    example: 50000,
    description:
      'Monthly Recurring Revenue for the organization linked to the API key, in org default currency',
    type: Number,
  })
  mrr: number;

  @ApiProperty({
    example: 600000,
    description:
      'Annual Recurring Revenue (MRR × 12) for the organization linked to the API key, in org default currency',
    type: Number,
  })
  arr: number;

  @ApiProperty({
    example: 14250,
    description:
      'Predicted per-customer lifetime value (Customer Value x Avg Lifespan) for the linked organization, in org default currency',
    type: Number,
  })
  merchant_lifetime_value: number;

  @ApiPropertyOptional({ example: 3, type: Number })
  retry_payment_every?: number | null;

  @ApiPropertyOptional({ example: 5, type: Number })
  total_retries?: number | null;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ type: String })
  created_at: string;

  @ApiProperty({ type: String })
  updated_at: string;
}
