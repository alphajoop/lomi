import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
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
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { SettlementsService } from './settlements.service';

@ApiTags('Settlements')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @ApiOperation({
    summary: 'List settlement periods',
    description:
      'Returns completed payment totals grouped by availability date and currency. Each settlement_id is {currency}:{YYYY-MM-DD} (UTC date of available_at).',
  })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'currency', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Settlement periods' })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('currency') currency?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize = 50,
  ) {
    return this.settlementsService.findAll(
      user,
      page,
      pageSize,
      startDate,
      endDate,
      currency,
    );
  }

  @Get(':id/transactions')
  @ApiOperation({
    summary: 'List transactions in a settlement period',
    description:
      'Returns completed transactions whose available_at falls on the settlement date for the given currency.',
  })
  @ApiParam({
    name: 'id',
    description: 'Settlement id, format {currency}:{YYYY-MM-DD}',
    example: 'XOF:2026-06-01',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions in settlement' })
  findTransactions(
    @CurrentUser() user: AuthContext,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize = 50,
  ) {
    return this.settlementsService.findTransactions(
      user,
      decodeURIComponent(id),
      page,
      pageSize,
    );
  }
}
