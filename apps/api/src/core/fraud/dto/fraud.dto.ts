import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateFraudRuleDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  custom_threshold?: number;

  @ApiPropertyOptional({ enum: ['flag', 'block'] })
  @IsOptional()
  @IsEnum(['flag', 'block'])
  custom_action?: 'flag' | 'block';
}

export class UpdateFraudAlertDto {
  @ApiProperty({ enum: ['resolved', 'dismissed'] })
  @IsEnum(['resolved', 'dismissed'])
  status: 'resolved' | 'dismissed';
}
