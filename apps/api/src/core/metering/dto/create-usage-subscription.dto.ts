import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsageSubscriptionDto {
  @ApiProperty({ type: String, description: 'Customer to enroll' })
  customer_id: string;

  @ApiProperty({ type: String, description: 'usage_based product id' })
  product_id: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Price id (defaults to product default price)',
  })
  price_id?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata?: Record<string, unknown>;
}

export class UsageSubscriptionResponseDto {
  @ApiProperty({ type: String })
  subscription_id: string;
}
