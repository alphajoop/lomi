import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateUsageSubscriptionDto {
  @ApiProperty({ type: String, description: 'Customer to enroll' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ type: String, description: 'usage_based product id' })
  @IsUUID()
  product_id: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Price id (defaults to product default price)',
  })
  @IsUUID()
  @IsOptional()
  price_id?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UsageSubscriptionResponseDto {
  @ApiProperty({ type: String })
  subscription_id: string;
}
