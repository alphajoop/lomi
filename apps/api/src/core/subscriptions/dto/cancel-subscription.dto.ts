import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    example: false,
    description:
      'If true, cancel at end of current billing period. If false or omitted, cancel immediately.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  cancel_at_period_end?: boolean;

  @ApiPropertyOptional({
    example: 'Customer requested cancellation',
    description: 'Reason for cancellation (stored in metadata)',
  })
  @IsString()
  @IsOptional()
  cancellation_reason?: string;
}
