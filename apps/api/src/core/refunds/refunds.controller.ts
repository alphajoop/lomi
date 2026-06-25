import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolveRequestIdempotency } from '../../utils/idempotency-fingerprint';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import {
  CreateRefundResponseDto,
  RefundListItemDto,
} from './dto/refund-response.dto';

@ApiTags('Remboursements')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Créer un remboursement',
    description:
      'Refunds a completed transaction (card, Wave, or MTN MoMo). Merchant balance updates immediately. Supports full and partial refunds. In test mode, MTN refunds are ledger-only (no MTN API call). In live mode, MTN MoMo requires a RequestToPay reference on the original transaction.',
  })
  @ApiBody({ type: CreateRefundDto })
  @ApiResponse({
    status: 201,
    description: 'Remboursement enregistré',
    type: CreateRefundResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Entrée invalide ou type non pris en charge',
  })
  async create(
    @Body() createRefundDto: CreateRefundDto,
    @CurrentUser() user: AuthContext,
    @Headers('idempotency-key') idempotencyKey?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    const idempotency = resolveRequestIdempotency(
      idempotencyKey,
      JSON.parse(JSON.stringify(createRefundDto)) as Record<string, unknown>,
    );
    return this.refundsService
      .create(createRefundDto, user, idempotency)
      .then((result) => {
        if (result.idempotencyCacheHit && res) {
          res.setHeader('Idempotency-Cache-Hit', 'true');
        }
        return result.data;
      });
  }

  @Get()
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Lister les remboursements' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des remboursements' })
  async findAll(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset = 0,
  ) {
    return this.refundsService.findAll(
      user,
      status,
      startDate,
      endDate,
      limit,
      offset,
    );
  }

  @Get(':id')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Obtenir un remboursement' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({
    status: 200,
    description: 'Détail du remboursement',
    type: RefundListItemDto,
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.refundsService.findOne(id, user);
  }
}
