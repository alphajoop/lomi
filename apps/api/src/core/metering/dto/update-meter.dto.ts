import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeterDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  filter?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  aggregation?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Boolean })
  is_active?: boolean;
}
