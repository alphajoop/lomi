import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsageEventDto {
  @ApiProperty({
    type: String,
    example: 'evt_abc123',
    description: 'Idempotency key — unique per organization',
  })
  transaction_id: string;

  @ApiProperty({
    type: String,
    example: 'api_calls',
    description: 'Billable metric code (matches meter name)',
  })
  code: string;

  @ApiProperty({ type: String, description: 'Customer being billed' })
  customer_id: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional usage subscription anchor',
  })
  subscription_id?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2025-06-01T12:00:00Z',
    description: 'When usage occurred (defaults to now)',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Usage units (defaults to 1)',
  })
  quantity?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { quantity: 5, region: 'sn' },
    description: 'Additional properties for sum aggregation',
  })
  properties?: Record<string, unknown>;
}

export class UsageEventResponseDto {
  @ApiProperty({ type: String })
  event_id: string;

  @ApiProperty({ enum: ['pending', 'processed', 'failed'] })
  status: string;

  @ApiPropertyOptional({ type: String })
  meter_id?: string;

  @ApiPropertyOptional({ type: String })
  subscription_id?: string;

  @ApiPropertyOptional({ type: Number })
  quantity_applied?: number;
}
