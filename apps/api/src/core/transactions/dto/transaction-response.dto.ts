import { ApiProperty } from '@nestjs/swagger';

/** Explicit `type` on each field avoids bad inferred metadata from prototype keys. */
export class TransactionResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique transaction identifier',
    type: String,
  })
  transaction_id: string;

  @ApiProperty({
    example: '789e0123-e89b-12d3-a456-426614174000',
    description: 'Organization ID',
    type: String,
  })
  organization_id: string;

  @ApiProperty({
    example: '456e7890-e89b-12d3-a456-426614174000',
    description: 'Customer ID',
    type: String,
  })
  customer_id: string;

  @ApiProperty({
    example: '321e4567-e89b-12d3-a456-426614174000',
    description: 'Product ID (if applicable)',
    nullable: true,
    type: String,
  })
  product_id: string | null;

  @ApiProperty({
    example: '654e7890-e89b-12d3-a456-426614174000',
    description: 'Subscription ID (if applicable)',
    nullable: true,
    type: String,
  })
  subscription_id: string | null;

  @ApiProperty({
    example: '987e6543-e89b-12d3-a456-426614174000',
    description: 'Price ID used for this transaction',
    nullable: true,
    type: String,
  })
  price_id: string | null;

  @ApiProperty({
    example: 'payment',
    description: 'Transaction type',
    enum: ['payment', 'refund', 'payout'],
    type: String,
  })
  transaction_type: string;

  @ApiProperty({
    example: 'completed',
    description: 'Transaction status',
    enum: [
      'pending',
      'completed',
      'failed',
      'refunded',
      'expired',
      'cancelled',
    ],
    type: String,
  })
  status: string;

  @ApiProperty({
    example: 'Payment for Premium Subscription',
    description: 'Transaction description',
    nullable: true,
    type: String,
  })
  description: string | null;

  @ApiProperty({
    example: 1,
    description: 'Quantity of items',
    type: Number,
  })
  quantity: number;

  @ApiProperty({
    example: { order_number: 'ORD-12345' },
    description: 'Additional metadata as JSON',
    nullable: true,
    type: Object,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    example: 10000.0,
    description: 'Gross amount (total including fees)',
    type: Number,
  })
  gross_amount: number;

  @ApiProperty({
    example: 500.0,
    description: 'Total discount amount applied',
    type: Number,
  })
  discount_amount: number;

  @ApiProperty({
    example: 200.0,
    description: 'Fee amount charged',
    type: Number,
  })
  fee_amount: number;

  @ApiProperty({
    example: 9300.0,
    description: 'Net amount (received after fees)',
    type: Number,
  })
  net_amount: number;

  @ApiProperty({
    example: 2500.0,
    description:
      'Cumulative amount refunded to the customer across completed refunds on this transaction',
    type: Number,
  })
  refunded_amount: number;

  @ApiProperty({
    example: 'XOF',
    description: 'Currency code',
    type: String,
  })
  currency_code: string;

  @ApiProperty({
    example: 'WAVE',
    description: 'Payment provider code',
    type: String,
  })
  provider_code: string;

  @ApiProperty({
    example: 'MOBILE_MONEY',
    description: 'Payment method code',
    type: String,
  })
  payment_method_code: string;

  @ApiProperty({
    example: 'SPI-TX-123456',
    description: 'SPI transaction ID (if applicable)',
    nullable: true,
    type: String,
  })
  spi_tx_id: string | null;

  @ApiProperty({
    example: '221771234567',
    description: 'SPI account number used (if applicable)',
    nullable: true,
    type: String,
  })
  spi_account_number: string | null;

  @ApiProperty({
    example: '000',
    description: 'SPI payment category (if applicable)',
    nullable: true,
    type: String,
  })
  spi_payment_category: string | null;

  @ApiProperty({
    example: 'IRREVOCABLE',
    description: 'SPI payment status (if applicable)',
    nullable: true,
    type: String,
  })
  spi_payment_status: string | null;

  @ApiProperty({
    example: false,
    description: 'Whether this is a Buy Now Pay Later transaction',
    type: Boolean,
  })
  is_bnpl: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this is a POS (Point of Sale) transaction',
    type: Boolean,
  })
  is_pos: boolean;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'SPI payment sent date (if applicable)',
    nullable: true,
    type: String,
  })
  spi_date_envoi: string | null;

  @ApiProperty({
    example: '2024-01-15T10:35:00Z',
    description: 'SPI payment irreversible date (if applicable)',
    nullable: true,
    type: String,
  })
  spi_date_irrevocabilite: string | null;

  @ApiProperty({
    example: 'live',
    description: 'Environment (test or live)',
    enum: ['test', 'live'],
    type: String,
  })
  environment: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'When the transaction was created',
    type: String,
  })
  created_at: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'When the transaction was last updated',
    type: String,
  })
  updated_at: string;
}
