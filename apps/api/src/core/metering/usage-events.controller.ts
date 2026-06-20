import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
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
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { UsageEventsService } from './usage-events.service';
import {
  CreateUsageEventDto,
  UsageEventResponseDto,
} from './dto/create-usage-event.dto';
import {
  CreateUsageSubscriptionDto,
  UsageSubscriptionResponseDto,
} from './dto/create-usage-subscription.dto';
import { ListUsageEventsQueryDto } from './dto/list-usage-events-query.dto';
import { UsageEventListItemDto } from './dto/usage-event-response.dto';

@ApiTags('Usage events')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller()
export class UsageEventsController {
  constructor(private readonly usageEventsService: UsageEventsService) {}

  @Get('usage-events')
  @ApiOperation({ summary: 'List usage events' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  @ApiQuery({ name: 'customer_id', required: false })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'processed', 'failed'],
  })
  @ApiResponse({ status: 200, type: UsageEventListItemDto, isArray: true })
  findAll(
    @Query() query: ListUsageEventsQueryDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.usageEventsService.findAll(user, query);
  }

  @Get('usage-events/:id')
  @ApiOperation({ summary: 'Get a usage event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: UsageEventListItemDto })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.usageEventsService.findOne(id, user);
  }

  @Post('usage-events')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Record a usage event',
    description:
      'Idempotent usage ingest. Events are processed asynchronously and update meter balances.',
  })
  @ApiResponse({ status: 202, type: UsageEventResponseDto })
  ingest(@Body() dto: CreateUsageEventDto, @CurrentUser() user: AuthContext) {
    return this.usageEventsService.ingest(dto, user);
  }

  @Post('usage-subscriptions')
  @ApiOperation({
    summary: 'Create a usage subscription',
    description:
      'Enrolls a customer on a usage_based product without an upfront charge. Required before billing metered usage.',
  })
  @ApiResponse({ status: 201, type: UsageSubscriptionResponseDto })
  createUsageSubscription(
    @Body() dto: CreateUsageSubscriptionDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.usageEventsService.createUsageSubscription(dto, user);
  }
}
