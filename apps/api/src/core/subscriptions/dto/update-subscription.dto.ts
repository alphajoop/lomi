import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    example: 'paused',
    enum: [
      'pending',
      'active',
      'paused',
      'cancelled',
      'expired',
      'past_due',
      'trial',
    ],
  })
  @IsIn([
    'pending',
    'active',
    'paused',
    'cancelled',
    'expired',
    'past_due',
    'trial',
  ])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  next_billing_date?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
