import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundSubscriptionActionDto {
  @ApiPropertyOptional({ type: Boolean })
  applied?: boolean;

  @ApiPropertyOptional({ type: String })
  action?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  subscription_id?: string | null;

  @ApiPropertyOptional({ type: String })
  previous_status?: string;

  @ApiPropertyOptional({ type: String })
  reason?: string;
}

export class CreateRefundResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  success: boolean;

  @ApiProperty({ example: 'refund-uuid', type: String })
  refund_id: string;

  @ApiProperty({ example: 'transaction-uuid', type: String })
  transaction_id: string;

  @ApiProperty({ example: 5000, type: Number })
  refunded_amount: number;

  @ApiProperty({ example: 'completed', type: String })
  status: string;

  @ApiPropertyOptional({
    example: 'Refund recorded. Customer credit is processed by our team.',
    type: String,
  })
  message?: string;

  @ApiPropertyOptional({
    description:
      'Subscription side-effect applied after refund (if transaction was linked to a subscription).',
    type: () => RefundSubscriptionActionDto,
    example: { applied: true, action: 'cancel', subscription_id: 'sub-uuid' },
  })
  subscription_action?: RefundSubscriptionActionDto;
}

export class RefundListItemDto {
  @ApiProperty({ example: 'refund-uuid', type: String })
  refund_id: string;

  @ApiProperty({ example: 'transaction-uuid', type: String })
  transaction_id: string;

  @ApiProperty({ example: 5000, type: Number })
  amount: number;

  @ApiProperty({ example: 5000, type: Number })
  refunded_amount: number;

  @ApiProperty({ example: 100, type: Number })
  fee_amount: number;

  @ApiPropertyOptional({ type: String })
  reason?: string;

  @ApiProperty({ example: 'completed', type: String })
  status: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', type: String })
  created_at: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', type: String })
  updated_at: string;
}
