import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDto } from './create-charge.dto';

export class CreateMtnChargeDto {
  @ApiProperty({ type: Number, example: 1000 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ type: String, example: 'XOF' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsUUID()
  @IsOptional()
  merchantId?: string;

  @ApiProperty({ type: () => CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  @IsNotEmpty()
  customer: CustomerDto;

  @ApiPropertyOptional({ type: String, example: 'Payment for Service' })
  @IsString()
  @IsOptional()
  description?: string;

  /** ISO 3166-1 alpha-2 (default CI). */
  @ApiPropertyOptional({ type: String, example: 'CI' })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiPropertyOptional({ type: Number, example: 1, default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  quantity?: number;
}
