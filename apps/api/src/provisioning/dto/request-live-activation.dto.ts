import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class RequestLiveActivationDto {
  @ApiPropertyOptional({
    description: 'Optional agent trace metadata stored on the live activation request.',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
