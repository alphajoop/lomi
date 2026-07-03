import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreditWalletDto {
  @ApiProperty({ type: String })
  @IsUUID()
  meter_id: string;

  @ApiProperty({ type: String })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ type: Number, example: 100 })
  @IsNumber()
  units: number;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  reason?: string;
}
