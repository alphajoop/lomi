import { ApiProperty } from '@nestjs/swagger';

/** Explicit `type` on each field avoids bad inferred metadata from prototype keys. */
export class CheckoutSessionResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  allow_coupon_code: boolean;

  @ApiProperty({ example: true, type: Boolean })
  allow_quantity: boolean;

  @ApiProperty({ example: 123, type: Number })
  amount: number;

  @ApiProperty({ example: 'string', type: String })
  cancel_url: string;

  @ApiProperty({ example: 'string', type: String })
  checkout_session_id: string;

  @ApiProperty({
    example:
      'https://checkout.lomi.africa/checkout/123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  checkout_url: string;

  @ApiProperty({ example: 'string', type: String })
  created_at: string;

  @ApiProperty({ example: 'string', type: String })
  created_by: string;

  @ApiProperty({ example: 'string', type: String })
  currency_code: string;

  @ApiProperty({ example: 'string', type: String })
  customer_email: string;

  @ApiProperty({ example: 'string', type: String })
  customer_id: string;

  @ApiProperty({ example: 'string', type: String })
  customer_name: string;

  @ApiProperty({ example: 'string', type: String })
  customer_phone: string;

  @ApiProperty({ example: 'string', type: String })
  description: string;

  @ApiProperty({ example: 'string', type: String })
  environment: string;

  @ApiProperty({ example: 'string', type: String })
  expires_at: string;

  @ApiProperty({ example: 'string', type: String })
  installment_plan_id: string;

  @ApiProperty({ example: true, type: Boolean })
  is_pos: boolean;

  @ApiProperty({ example: true, type: Boolean })
  is_spi: boolean;

  @ApiProperty({ example: {}, type: Object })
  metadata: any;

  @ApiProperty({ example: 'string', type: String })
  organization_id: string;

  @ApiProperty({ example: 'string', type: String })
  payment_link_id: string;

  @ApiProperty({ example: 'string', type: String })
  payment_request_id: string;

  @ApiProperty({ example: 'string', type: String })
  price_id: string;

  @ApiProperty({ example: 'string', type: String })
  product_id: string;

  @ApiProperty({ example: {}, type: Object })
  qr_code_data: any;

  @ApiProperty({ example: 'string', type: String })
  qr_code_type: string;

  @ApiProperty({ example: 123, type: Number })
  quantity: number;

  @ApiProperty({ example: true, type: Boolean })
  require_billing_address: boolean;

  @ApiProperty({ example: true, type: Boolean })
  require_email: boolean;

  @ApiProperty({ example: false, type: Boolean })
  require_phone: boolean;

  @ApiProperty({ example: true, type: Boolean })
  require_name: boolean;

  @ApiProperty({ example: 'string', type: String })
  spi_account_number: string;

  @ApiProperty({ example: 'string', type: String })
  spi_qr_code_id: string;

  @ApiProperty({ example: 'string', type: String })
  status: string;

  @ApiProperty({ example: 'string', type: String })
  subscription_id: string;

  @ApiProperty({ example: 'string', type: String })
  success_url: string;

  @ApiProperty({ example: 'string', type: String })
  title: string;

  @ApiProperty({ example: 'string', type: String })
  updated_at: string;
}
