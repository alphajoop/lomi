import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateMeterDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  filter?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  aggregation?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
