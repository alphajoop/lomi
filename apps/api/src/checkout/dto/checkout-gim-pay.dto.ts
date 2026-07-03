import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CheckoutGimPayDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  checkoutSessionId: string;

  @ApiProperty({ type: String })
  @IsString()
  pan: string;

  @ApiProperty({ type: String, example: '06/25' })
  @IsString()
  expiry: string;

  @ApiProperty({ type: String })
  @IsString()
  cvv: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  cardHolderName?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  ecomIp?: string;
}
