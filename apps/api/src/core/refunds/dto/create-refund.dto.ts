import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({
    description:
      'UUID of a completed transaction (Stripe card, Wave, or MTN MoMo)',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty({
    description: 'Amount to refund (same currency as the transaction)',
    type: Number,
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ description: 'Reason for the refund', type: String })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Full or partial refund. If omitted, full when amount equals transaction gross amount.',
    enum: ['full', 'partial'],
  })
  @IsEnum(['full', 'partial'])
  @IsOptional()
  refund_type?: 'full' | 'partial';

  @ApiPropertyOptional({
    description:
      'Subscription side-effect after a full refund: default (cancel initial payment, pause renewal), cancel, pause, or none.',
    enum: ['default', 'cancel', 'pause', 'none'],
  })
  @IsEnum(['default', 'cancel', 'pause', 'none'])
  @IsOptional()
  subscription_action?: 'default' | 'cancel' | 'pause' | 'none';
}
