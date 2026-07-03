import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Only the fields the update service actually consumes are exposed. Internal
 * columns (verification_token, delivery stats, environment, deleted_at, ...)
 * are intentionally omitted so clients cannot set them.
 */
export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'https://example.com/webhooks/lomi' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    example: ['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  authorized_events?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
