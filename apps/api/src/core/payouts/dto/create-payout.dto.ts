import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PayoutRecipientDto {
  @ApiProperty({ example: 'Ada Lovelace', type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+221771234567', type: String })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class CreatePayoutDto {
  @ApiProperty({ enum: ['self', 'beneficiary'], type: String })
  @IsEnum(['self', 'beneficiary'])
  destination: 'self' | 'beneficiary';

  @ApiProperty({ enum: ['wave', 'spi', 'bank', 'mtn'], type: String })
  @IsEnum(['wave', 'spi', 'bank', 'mtn'])
  rail: 'wave' | 'spi' | 'bank' | 'mtn';

  @ApiProperty({ example: 5000, type: Number })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'XOF', type: String })
  @IsString()
  @IsNotEmpty()
  currency_code: string;

  @ApiPropertyOptional({
    description: 'Required for self payouts and beneficiary SPI',
    type: String,
  })
  @IsUUID()
  @IsOptional()
  payout_method_id?: string;

  @ApiPropertyOptional({ type: PayoutRecipientDto })
  @ValidateNested()
  @Type(() => PayoutRecipientDto)
  @IsOptional()
  recipient?: PayoutRecipientDto;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
