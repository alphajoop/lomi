import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageEventListItemDto {
  @ApiProperty({ type: String })
  event_id: string;

  @ApiProperty({ type: String })
  transaction_id: string;

  @ApiProperty({ type: String })
  code: string;

  @ApiProperty({ type: String })
  customer_id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  subscription_id?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  meter_id?: string | null;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ enum: ['pending', 'processed', 'failed'] })
  processing_status: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  error_message?: string | null;

  @ApiProperty({ type: String })
  occurred_at: string;

  @ApiProperty({ type: String })
  created_at: string;

  @ApiPropertyOptional({ type: Number })
  total_count?: number;
}
