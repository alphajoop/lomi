import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProvisioningAccountDto {
  @ApiProperty({ example: 'merchant@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @MinLength(1)
  full_name!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when terms were accepted',
    example: '2026-07-03T08:00:00.000Z',
  })
  @IsISO8601()
  terms_accepted_at!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsString()
  @MinLength(1)
  terms_version!: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  preferred_language?: string;
}
