import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMeterDto {
  @ApiProperty({
    type: String,
    example: 'api_calls',
    description: 'Unique meter code (slug) per organization',
  })
  name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional usage_based product this meter bills against',
  })
  product_id?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { code: 'api_calls' },
    description: 'Event matching filter',
  })
  filter?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { type: 'sum', property: 'quantity' },
    description:
      'Aggregation config: sum, count, max, last_during_period, last_ever',
  })
  aggregation?: Record<string, unknown>;
}
