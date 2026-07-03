import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class MintPartnerProvisioningKeyDto {
  @ApiProperty({ example: 'Acme user onboarding' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Partner-side identifier for the end user (for attribution and idempotency)',
    example: 'user_abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  external_user_ref?: string;

  @ApiPropertyOptional({ enum: ['test', 'live'], default: 'test' })
  @IsOptional()
  @IsIn(['test', 'live'])
  environment?: 'test' | 'live';
}
