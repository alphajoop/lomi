import { ApiProperty } from '@nestjs/swagger';
import { LOG_TYPES } from '../logs.types';
import { LogEntryResponseDto } from './log-entry-response.dto';

export class LogListResponseDto {
  @ApiProperty({ example: 'list', type: String })
  object: 'list';

  @ApiProperty({ enum: LOG_TYPES, example: 'api_request' })
  type: (typeof LOG_TYPES)[number];

  @ApiProperty({ type: LogEntryResponseDto, isArray: true })
  data: LogEntryResponseDto[];

  @ApiProperty({ example: 42, type: Number })
  total_count: number;

  @ApiProperty({ example: 25, type: Number })
  limit: number;

  @ApiProperty({ example: 0, type: Number })
  offset: number;

  @ApiProperty({ example: true, type: Boolean })
  has_more: boolean;
}
