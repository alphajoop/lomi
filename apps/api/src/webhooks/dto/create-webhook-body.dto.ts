import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookBodyDto {
  @ApiProperty({
    example: 'https://example.com/webhooks/lomi',
    type: String,
  })
  url: string;

  @ApiProperty({
    example: ['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'DISPUTE_CREATED', 'PAYMENT_RISK_FLAGGED'],
    type: [String],
  })
  authorized_events: string[];

  @ApiPropertyOptional({
    example: 'Webhook for payment events',
    type: String,
  })
  description?: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}
