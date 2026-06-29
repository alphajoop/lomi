import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutGimPayDto {
  @ApiProperty({ type: String, format: 'uuid' })
  checkoutSessionId: string;

  @ApiProperty({ type: String })
  pan: string;

  @ApiProperty({ type: String, example: '06/25' })
  expiry: string;

  @ApiProperty({ type: String })
  cvv: string;

  @ApiPropertyOptional({ type: String })
  cardHolderName?: string;

  @ApiPropertyOptional({ type: String })
  ecomIp?: string;
}
