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
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { CreatePayoutResponseDto } from './dto/payout-response.dto';

@ApiTags('Virements')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('payouts')
export class PayoutsUnifiedController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un virement',
    description:
      'Virement vers votre compte enregistré (self) ou vers un tiers sur mobile money / SPI (beneficiary).',
  })
  @ApiResponse({
    status: 201,
    description: 'Virement initié',
    type: CreatePayoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Entrée invalide ou rail non pris en charge',
  })
  create(
    @Body() dto: CreatePayoutDto,
    @CurrentUser() user: AuthContext,
    @Headers('idempotency-key') idempotencyKey?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    const idempotency = resolveRequestIdempotency(
      idempotencyKey,
      JSON.parse(JSON.stringify(dto)) as Record<string, unknown>,
    );
    return this.payoutsService.create(dto, user, idempotency).then((result) => {
      if (result.idempotencyCacheHit && res) {
        res.setHeader('Idempotency-Cache-Hit', 'true');
      }
      return result.data;
    });
  }

  @Get()
  @ApiOperation({ summary: 'Lister les virements' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des virements' })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize = 50,
  ) {
    const statuses = status
      ? status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    return this.payoutsService.findAll(
      user,
      statuses,
      page,
      pageSize,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un virement' })
  @ApiParam({ name: 'id', description: 'Payout ID' })
  @ApiResponse({ status: 200, description: 'Détail du virement' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.payoutsService.findOne(id, user);
  }
}
