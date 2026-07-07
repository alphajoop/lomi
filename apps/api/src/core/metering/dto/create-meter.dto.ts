import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMeterDto {
  @ApiProperty({
    type: String,
    example: 'api_calls',
    description: 'Unique meter code (slug) per organization',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Optional usage_based product this meter bills against',
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { code: 'api_calls' },
    description: 'Event matching filter',
  })
  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { type: 'sum', property: 'quantity' },
    description:
      'Aggregation config: sum, count, max, last_during_period, last_ever',
  })
  @IsObject()
  @IsOptional()
  aggregation?: Record<string, unknown>;
}
