import { ApiProperty } from '@nestjs/swagger';

/** Explicit `type` on each field avoids bad inferred metadata from prototype keys. */
export class OrganizationResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique organization identifier',
    type: String,
  })
  organization_id: string;

  @ApiProperty({
    example: 'Acme Inc',
    description: 'Organization name',
    type: String,
  })
  name: string;

  @ApiProperty({
    example: 'contact@acme.com',
    description: 'Organization email',
    type: String,
  })
  email: string;

  @ApiProperty({
    example: '+221771234567',
    description: 'Organization phone number',
    type: String,
  })
  phone_number: string;

  @ApiProperty({
    example: 'verified',
    enum: ['unverified', 'starter', 'verified'],
    description: 'KYC verification status',
    type: String,
  })
  verification_status: string;

  @ApiProperty({
    example: 'https://acme.com',
    description: 'Organization website',
    required: false,
    type: String,
  })
  website_url: string | null;

  @ApiProperty({
    example: 'https://cdn.lomi.africa/logos/acme.png',
    description: 'Organization logo URL',
    required: false,
    type: String,
  })
  logo_url: string | null;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'inactive', 'suspended'],
    description: 'Organization status',
    type: String,
  })
  status: string;

  @ApiProperty({
    example: 'XOF',
    enum: ['XOF', 'USD', 'EUR'],
    description: 'Default currency',
    type: String,
  })
  default_currency: string;

  @ApiProperty({
    example: 'acme-inc',
    description: 'URL-friendly slug',
    required: false,
    type: String,
  })
  slug: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether storefront is enabled',
    type: Boolean,
  })
  storefront_enabled: boolean;

  @ApiProperty({
    example: 250000.0,
    description: 'Total revenue generated',
    type: Number,
  })
  total_revenue: number | null;

  @ApiProperty({
    example: 1234,
    description: 'Total transaction count',
    type: Number,
  })
  total_transactions: number | null;

  @ApiProperty({
    example: 5,
    description: 'Total merchant count',
    type: Number,
  })
  total_merchants: number | null;

  @ApiProperty({
    example: 567,
    description: 'Total customer count',
    type: Number,
  })
  total_customers: number | null;

  @ApiProperty({
    example: 50000.0,
    description: 'Monthly Recurring Revenue',
    type: Number,
  })
  mrr: number;

  @ApiProperty({
    example: 600000.0,
    description: 'Annual Recurring Revenue',
    type: Number,
  })
  arr: number;

  @ApiProperty({
    example: 14250.0,
    description:
      'Predicted per-customer lifetime value (Customer Value x Avg Lifespan), org default currency',
    type: Number,
  })
  merchant_lifetime_value: number;

  @ApiProperty({
    example: '10-50',
    description: 'Number of employees',
    required: false,
    type: String,
  })
  employee_number: string | null;

  @ApiProperty({
    example: 'Technology',
    description: 'Industry sector',
    required: false,
    type: String,
  })
  industry: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether a payout PIN is configured (not the PIN value)',
    required: false,
    type: Boolean,
  })
  has_payout_pin: boolean | null;

  @ApiProperty({
    example: false,
    description: 'Whether this is a starter business',
    type: Boolean,
  })
  is_starter_business: boolean;

  @ApiProperty({
    example: { custom_field: 'value' },
    description: 'Additional metadata',
    required: false,
    type: Object,
  })
  metadata: any;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Organization creation timestamp',
    type: String,
  })
  created_at: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last update timestamp',
    type: String,
  })
  updated_at: string;

  @ApiProperty({
    example: false,
    description: 'Whether organization is soft-deleted',
    type: Boolean,
  })
  is_deleted: boolean;

  @ApiProperty({
    example: null,
    description: 'Deletion timestamp if deleted',
    required: false,
    type: String,
  })
  deleted_at: string | null;
}
