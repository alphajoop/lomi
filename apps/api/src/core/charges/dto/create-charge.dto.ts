import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerDto {
  @ApiProperty({ type: String, example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ type: String, example: 'jane@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    type: String,
    example: '+2250707070707',
    description: 'E.164 phone number required for mobile-money rails',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class CreateWaveChargeDto {
  @ApiProperty({ type: Number, example: 1000, description: 'Amount in XOF (minimum 100)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ type: String, example: 'XOF', description: 'Must be XOF for Wave' })
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

  @ApiPropertyOptional({ type: String, example: 'https://your-site.com/success' })
  @IsString()
  @IsOptional()
  successUrl?: string;

  @ApiPropertyOptional({ type: String, example: 'https://your-site.com/error' })
  @IsString()
  @IsOptional()
  errorUrl?: string;

  @ApiPropertyOptional({ type: String, enum: ['live', 'test'] })
  @IsString()
  @IsOptional()
  environment?: string;
}
