import { ApiProperty } from '@nestjs/swagger';
import { LOG_SEVERITIES, LOG_TYPES } from '../logs.types';

export class LogEntryResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  id: string;

  @ApiProperty({ enum: LOG_TYPES, example: 'api_request' })
  type: (typeof LOG_TYPES)[number];

  @ApiProperty({ example: '2024-01-15T10:30:00Z', type: String })
  timestamp: string;

  @ApiProperty({ enum: LOG_SEVERITIES, example: 'info' })
  severity: (typeof LOG_SEVERITIES)[number];

  @ApiProperty({ example: 200, nullable: true, type: Number })
  status_code: number | null;

  @ApiProperty({ example: 'GET', nullable: true, type: String })
  method: string | null;

  @ApiProperty({ example: '/transactions', nullable: true, type: String })
  endpoint: string | null;

  @ApiProperty({
    example: 'Payment not found',
    nullable: true,
    type: String,
  })
  message: string | null;

  @ApiProperty({ example: true, nullable: true, type: Boolean })
  success: boolean | null;

  @ApiProperty({
    example: 'req_abc123',
    nullable: true,
    type: String,
  })
  request_id: string | null;

  @ApiProperty({
    description: 'Type-specific payload',
    type: Object,
  })
  data: Record<string, unknown>;
}
