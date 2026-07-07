import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateUsageEventDto {
  @ApiProperty({
    type: String,
    example: 'evt_abc123',
    description: 'Idempotency key, unique per organization',
  })
  @IsString()
  transaction_id: string;

  @ApiProperty({
    type: String,
    example: 'api_calls',
    description: 'Billable metric code (matches meter name)',
  })
  @IsString()
  code: string;

  @ApiProperty({ type: String, description: 'Customer being billed' })
  @IsUUID()
  customer_id: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional usage subscription anchor',
  })
  @IsUUID()
  @IsOptional()
  subscription_id?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2025-06-01T12:00:00Z',
    description: 'When usage occurred (defaults to now)',
  })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Usage units (defaults to 1)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { quantity: 5, region: 'sn' },
    description: 'Additional properties for sum aggregation',
  })
  @IsObject()
  @IsOptional()
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
