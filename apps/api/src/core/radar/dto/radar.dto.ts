import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateRadarSettingsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: ['monitor', 'block'] })
  @IsOptional()
  @IsEnum(['monitor', 'block'])
  mode?: 'monitor' | 'block';

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  stripe_radar_passthrough?: boolean;
}
