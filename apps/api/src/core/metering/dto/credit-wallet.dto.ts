import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditWalletDto {
  @ApiProperty({ type: String })
  meter_id: string;

  @ApiProperty({ type: String })
  customer_id: string;

  @ApiProperty({ type: Number, example: 100 })
  units: number;

  @ApiPropertyOptional({ type: String })
  reason?: string;
}
