import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { LogEntryResponseDto } from './dto/log-entry-response.dto';
import { LogListResponseDto } from './dto/log-list-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { isLogType, LOG_TYPES } from './logs.types';

const MAX_LIMIT = 100;

function parseStatusQuery(value?: string): number[] | undefined {
  if (!value?.trim()) return undefined;
  const codes = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((code) => Number.isInteger(code) && code >= 100 && code <= 599);
  return codes.length > 0 ? codes : undefined;
}

@ApiTags('Logs')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List logs',
    description:
      'Returns paginated logs for the organization. The `type` query parameter selects which log stream to read:\n\n' +
      '- **api_request**: every authenticated API call (any HTTP status), including request/response payloads\n' +
      '- **api_error**: server-side failures with diagnostic detail (unhandled 500s; optional 503/429 when `LOG_HTTP_EXCEPTIONS` is enabled on the API host)\n' +
      '- **webhook_delivery**: outbound webhook delivery attempts and retries\n' +
      '- **activity**: organization audit events (configuration changes, security events)',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: LOG_TYPES,
    description: 'Log stream to query',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 25,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'ISO 8601 start timestamp (inclusive)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'ISO 8601 end timestamp (inclusive)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Comma-separated HTTP status codes (api_request, api_error). Example: 400,500',
  })
  @ApiQuery({
    name: 'severity',
    required: false,
    enum: ['info', 'warning', 'error', 'critical'],
  })
  @ApiQuery({
    name: 'webhook_id',
    required: false,
    type: String,
    description: 'Filter webhook_delivery logs by webhook ID',
  })
  @ApiQuery({
    name: 'success',
    required: false,
    type: Boolean,
    description: 'Only successful webhook deliveries',
  })
  @ApiQuery({
    name: 'failed',
    required: false,
    type: Boolean,
    description: 'Only failed webhook deliveries',
  })
  @ApiQuery({
    name: 'event',
    required: false,
    type: String,
    description: 'Filter activity logs by event type',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated log list',
    type: LogListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('type') type: string,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('webhook_id') webhookId?: string,
    @Query('success', new DefaultValuePipe(false), ParseBoolPipe)
    successOnly?: boolean,
    @Query('failed', new DefaultValuePipe(false), ParseBoolPipe)
    failedOnly?: boolean,
    @Query('event') event?: string,
  ) {
    if (!isLogType(type)) {
      throw new BadRequestException(
        `Invalid type. Must be one of: ${LOG_TYPES.join(', ')}`,
      );
    }

    const cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    return this.logsService.list(user, {
      type,
      limit: cappedLimit,
      offset: Math.max(offset, 0),
      startDate,
      endDate,
      status: parseStatusQuery(status),
      severity,
      webhookId,
      successOnly,
      failedOnly,
      event,
    });
  }

  @Get(':type/:id')
  @ApiOperation({
    summary: 'Get a log entry',
    description:
      'Returns a single log entry by type and ID. Responds with 404 when the entry does not exist or is outside the API key organization scope.',
  })
  @ApiParam({ name: 'type', enum: LOG_TYPES })
  @ApiParam({ name: 'id', type: String, description: 'Log entry UUID' })
  @ApiResponse({
    status: 200,
    description: 'Log entry details',
    type: LogEntryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Log not found or access denied' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  findOne(
    @CurrentUser() user: AuthContext,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    if (!isLogType(type)) {
      throw new BadRequestException(
        `Invalid type. Must be one of: ${LOG_TYPES.join(', ')}`,
      );
    }

    return this.logsService.findOne(user, type, id);
  }
}
