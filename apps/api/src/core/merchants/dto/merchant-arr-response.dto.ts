import { ApiProperty } from '@nestjs/swagger';

export class MerchantArrResponseDto {
  @ApiProperty({ type: String })
  merchant_id: string;

  @ApiProperty({
    example: 600000,
    description:
      'Annual Recurring Revenue (MRR × 12) for the organization linked to the API key, in org default currency',
    type: Number,
  })
  arr: number;

  @ApiProperty({ example: 'XOF', type: String })
  currency_code: string;

  @ApiProperty({ type: String })
  as_of_date: string;
}
