import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { resolveRequestIdempotency } from '../../utils/idempotency-fingerprint';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ChargesService } from './charges.service';
import { CardChargeService } from './card-charge.service';
import { CreateWaveChargeDto } from './dto/create-charge.dto';
import { CreateMtnChargeDto } from './dto/create-mtn-charge.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthContext } from '../common/decorators/current-user.decorator';
import { CreateCardChargeDto } from './dto/create-card-charge.dto';
import { CreateGimChargeDto } from './dto/create-gim-charge.dto';
import { CardChargeResponseDto } from './dto/card-charge-response.dto';
import { GimChargeResponseDto } from './dto/gim-charge-response.dto';
import { MtnChargeResponseDto } from './dto/mtn-charge-response.dto';
import { WaveChargeResponseDto } from './dto/wave-charge-response.dto';
import { GimChargeService } from '../gim/gim-charge.service';
import { normalizeScenarioKey } from './charge-scenario';
import { normalizeGimScenarioKey } from './gim-charge-scenario';
import { environmentFromAuth } from '../common/auth-environment';

@ApiTags('Encaissements')
@ApiSecurity('api-key')
@Controller('charge')
@UseGuards(ApiKeyGuard)
export class ChargesController {
  constructor(
    private readonly chargesService: ChargesService,
    private readonly cardChargeService: CardChargeService,
    private readonly gimChargeService: GimChargeService,
  ) {}

  @Post('wave')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Create direct Wave charge',
    description:
      'Starts a payer-facing Wave mobile-money charge. Redirect the customer to `wave_launch_url` or `checkout_url` in the response.',
  })
  @ApiBody({ type: CreateWaveChargeDto })
  @ApiResponse({
    status: 201,
    description: 'Wave charge initiated',
    type: WaveChargeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or Wave API error',
  })
  async createWaveCharge(
    @Body() createChargeDto: CreateWaveChargeDto,
    @CurrentUser() user: AuthContext,
    @Headers('x-scenario-key') scenarioHeader?: string | string[],
    @Headers('idempotency-key') idempotencyKey?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    createChargeDto.organizationId = user.organizationId;
    createChargeDto.merchantId = user.merchantId;
    const scenarioKey =
      environmentFromAuth(user) === 'test'
        ? normalizeScenarioKey(scenarioHeader)
        : undefined;
    const idempotency = resolveRequestIdempotency(
      idempotencyKey,
      JSON.parse(JSON.stringify(createChargeDto)) as Record<string, unknown>,
    );
    return this.chargesService
      .createWaveCharge(createChargeDto, user, scenarioKey, idempotency)
      .then((result) => {
        if (result.idempotencyCacheHit && res) {
          res.setHeader('Idempotency-Cache-Hit', 'true');
        }
        return result.data;
      });
  }

  @Post('mtn')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Create MTN MoMo charge',
    description:
      'Initiates an MTN Mobile Money RequestToPay. With a test API key the transaction completes in the ledger without calling the MTN sandbox.',
  })
  @ApiBody({ type: CreateMtnChargeDto })
  @ApiResponse({
    status: 201,
    description: 'MTN charge initiated',
    type: MtnChargeResponseDto,
  })
  async createMtnCharge(
    @Body() createChargeDto: CreateMtnChargeDto,
    @CurrentUser() user: AuthContext,
    @Headers('x-scenario-key') scenarioHeader?: string | string[],
    @Headers('idempotency-key') idempotencyKey?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    createChargeDto.organizationId = user.organizationId;
    createChargeDto.merchantId = user.merchantId;
    const scenarioKey =
      environmentFromAuth(user) === 'test'
        ? normalizeScenarioKey(scenarioHeader)
        : undefined;
    const idempotency = resolveRequestIdempotency(
      idempotencyKey,
      JSON.parse(JSON.stringify(createChargeDto)) as Record<string, unknown>,
    );
    return this.chargesService
      .createMtnCharge(createChargeDto, user, scenarioKey, idempotency)
      .then((result) => {
        if (result.idempotencyCacheHit && res) {
          res.setHeader('Idempotency-Cache-Hit', 'true');
        }
        return result.data;
      });
  }

  @Post('gim')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Create GIM Pay card charge (direct PayByCard)',
    description:
      'Charges a card via GIM Pay PayByCard. May return a redirect URL for 3DS or signal retry_other_rail to try another card-payment rail.',
  })
  @ApiResponse({
    status: 201,
    description: 'GIM charge created',
    type: GimChargeResponseDto,
  })
  @ApiBody({ type: CreateGimChargeDto })
  createGimCharge(
    @Body() createDto: CreateGimChargeDto,
    @CurrentUser() user: AuthContext,
    @Headers('idempotency-key') idempotencyKey?: string | string[],
    @Headers('x-scenario-key') scenarioHeader?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    const idempotency = resolveRequestIdempotency(
      idempotencyKey,
      JSON.parse(JSON.stringify(createDto)) as Record<string, unknown>,
    );
    const scenarioKey =
      environmentFromAuth(user) === 'test'
        ? normalizeGimScenarioKey(scenarioHeader)
        : undefined;
    return this.gimChargeService
      .create(createDto, user, idempotency, scenarioKey)
      .then((result) => {
        if (result.idempotencyCacheHit && res) {
          res.setHeader('Idempotency-Cache-Hit', 'true');
        }
        return result.data;
      });
  }

  @Post('card')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Create card charge (client_secret)',
    description:
      'Creates an embedded card charge and returns the client_secret for your payment UI.',
  })
  @ApiResponse({
    status: 201,
    description: 'Card charge created',
    type: CardChargeResponseDto,
  })
  @ApiBody({ type: CreateCardChargeDto })
  createCardCharge(
    @Body() createDto: CreateCardChargeDto,
    @CurrentUser() user: AuthContext,
    @Headers('idempotency-key') idempotencyKey?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    const idempotency = resolveRequestIdempotency(
      idempotencyKey,
      JSON.parse(JSON.stringify(createDto)) as Record<string, unknown>,
    );
    return this.cardChargeService
      .create(createDto, user, idempotency)
      .then((result) => {
        if (result.idempotencyCacheHit && res) {
          res.setHeader('Idempotency-Cache-Hit', 'true');
        }
        return result.data;
      });
  }

  @Get('card/:id')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Retrieve card charge' })
  @ApiParam({ name: 'id', description: 'Card payment id (pi_...)' })
  @ApiResponse({
    status: 200,
    description: 'Card charge',
    type: CardChargeResponseDto,
  })
  getCardCharge(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.cardChargeService.findOne(id, user);
  }

  @Post('card/:id/cancel')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Cancel card charge' })
  @ApiParam({ name: 'id', description: 'Card payment id (pi_...)' })
  @ApiResponse({ status: 200, description: 'Card charge cancelled' })
  cancelCardCharge(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.cardChargeService.cancel(id, user);
  }
}
