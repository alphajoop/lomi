import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateWebhookBodyDto {
  @ApiProperty({
    example: 'https://example.com/webhooks/lomi',
    type: String,
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    example: [
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'DISPUTE_CREATED',
      'PAYMENT_RISK_FLAGGED',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  authorized_events: string[];

  @ApiPropertyOptional({
    example: 'Webhook for payment events',
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
