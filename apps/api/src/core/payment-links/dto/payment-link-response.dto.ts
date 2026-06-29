import { ApiProperty } from '@nestjs/swagger';

/** Explicit `type` on each field avoids bad inferred metadata from prototype keys. */
export class PaymentLinkResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  allow_coupon_code: boolean;

  @ApiProperty({ example: true, type: Boolean })
  allow_quantity: boolean;

  @ApiProperty({ example: 123, type: Number })
  amount: number;

  @ApiProperty({ example: 'string', type: String })
  cancel_url: string;

  @ApiProperty({ example: 'string', type: String })
  created_at: string;

  @ApiProperty({ example: 'string', type: String })
  created_by: string;

  @ApiProperty({ example: 'string', type: String })
  currency_code: string;

  @ApiProperty({ example: 'string', type: String })
  description: string;

  @ApiProperty({ example: 'string', type: String })
  environment: string;

  @ApiProperty({ example: 'string', type: String })
  expires_at: string;

  @ApiProperty({ example: true, type: Boolean })
  is_active: boolean;

  @ApiProperty({ example: 'string', type: String })
  link_id: string;

  @ApiProperty({ example: 'string', type: String })
  link_type: string;

  @ApiProperty({ example: {}, type: Object })
  metadata: any;

  @ApiProperty({ example: 'string', type: String })
  organization_id: string;

  @ApiProperty({ example: 'string', type: String })
  price_id: string;

  @ApiProperty({ example: 'string', type: String })
  product_id: string;

  @ApiProperty({ example: 123, type: Number })
  quantity: number;

  @ApiProperty({ example: true, type: Boolean })
  require_billing_address: boolean;

  @ApiProperty({ example: true, type: Boolean })
  require_email: boolean;

  @ApiProperty({ example: false, type: Boolean })
  require_phone: boolean;

  @ApiProperty({ example: 'string', type: String })
  success_url: string;

  @ApiProperty({ example: 'string', type: String })
  title: string;

  @ApiProperty({ example: 'string', type: String })
  updated_at: string;

  @ApiProperty({ example: 'string', type: String })
  url: string;
}
