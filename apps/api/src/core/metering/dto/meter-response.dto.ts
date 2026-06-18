import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeterResponseDto {
  @ApiProperty({ type: String })
  meter_id: string;

  @ApiProperty({ type: String })
  organization_id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  product_id?: string | null;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  filter: Record<string, unknown>;

  @ApiProperty({ type: 'object', additionalProperties: true })
  aggregation: Record<string, unknown>;

  @ApiProperty({ type: Boolean })
  is_active: boolean;

  @ApiProperty({ type: String })
  created_at: string;

  @ApiProperty({ type: String })
  updated_at: string;
}

export class MeterBalanceResponseDto {
  @ApiProperty({ type: String })
  balance_id: string;

  @ApiProperty({ type: String })
  meter_id: string;

  @ApiProperty({ type: String })
  customer_id: string;

  @ApiProperty({ type: Number })
  consumed_units: number;

  @ApiProperty({ type: Number })
  credited_units: number;

  @ApiProperty({ type: Number })
  balance: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  last_event_id?: string | null;

  @ApiProperty({ type: String })
  updated_at: string;
}
