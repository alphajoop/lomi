import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUsageEventsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 50 })
  page_size?: number;

  @ApiPropertyOptional({ type: String })
  customer_id?: string;

  @ApiPropertyOptional({ type: String })
  code?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'processed', 'failed'],
  })
  status?: string;
}
