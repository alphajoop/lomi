import { ApiProperty } from '@nestjs/swagger';

export class MerchantMrrResponseDto {
  @ApiProperty({ type: String })
  merchant_id: string;

  @ApiProperty({
    example: 50000,
    description:
      'Monthly Recurring Revenue for the organization linked to the API key, in org default currency',
    type: Number,
  })
  mrr: number;

  @ApiProperty({ example: 'XOF', type: String })
  currency_code: string;

  @ApiProperty({ type: String })
  as_of_date: string;
}
