import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Request body for `POST /charge/card`.
 * Validation runs in `CardChargeService` (Swagger schema generation is more reliable
 * with explicit primitive `type` hints than with `class-validator` on this shape).
 */
export class CreateCardChargeDto {
  @ApiProperty({
    type: Number,
    example: 10000,
    description: 'Amount to charge in the original currency',
  })
  amount: number;

  @ApiPropertyOptional({
    type: String,
    example: 'XOF',
    description: 'Currency code',
    enum: ['XOF', 'USD', 'EUR'],
  })
  currency_code?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'XOF',
    description:
      'Backward-compatible alias for currency_code. Use currency_code in new integrations.',
    enum: ['XOF', 'USD', 'EUR'],
  })
  currency?: string;

  @ApiPropertyOptional({
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Internal customer UUID (v4). Alternative: send customer_email + customer_name to create/find a customer.',
  })
  customer_id?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'john@example.com',
    description:
      'Customer email, required together with customer_name when customer_id is omitted.',
  })
  customer_email?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'John Doe',
    description:
      'Customer display name, required together with customer_email when customer_id is omitted.',
  })
  customer_name?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+221771234567',
    description: 'Customer phone number',
  })
  customer_phone?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Invoice #INV-2026-001',
    description: 'Description shown in payment providers and logs',
  })
  description?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'INV-2026-001',
    description: 'Reference included in metadata for reconciliation',
  })
  payment_reference?: string;

  @ApiPropertyOptional({
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Optional product UUID for metadata and reconciliation',
  })
  product_id?: string;

  @ApiPropertyOptional({
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440003',
    description: 'Optional subscription UUID for metadata and reconciliation',
  })
  subscription_id?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Optional quantity for internal reconciliation',
    default: 1,
  })
  quantity?: number;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    example: { order_id: 'ORD-12345' },
    description: 'Custom metadata merged into provider metadata',
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    type: String,
    example: 'light',
    enum: ['light', 'dark', 'flat'],
    description:
      'Optional Payment Element theme for client-side card UI: `light`, `dark`, or `flat`.',
  })
  appearance_theme?: 'light' | 'dark' | 'flat' | 'stripe' | 'night';

  @ApiPropertyOptional({
    type: Number,
    example: 6,
    description:
      'Optional Payment Element border radius (px) returned for client-side rendering.',
  })
  appearance_border_radius?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'never',
    enum: ['auto', 'never'],
    description:
      'Optional Payment Element billing address collection mode. Use `never` to hide country/address selector in Payment Element UI.',
  })
  appearance_billing_address?: 'auto' | 'never';
}
