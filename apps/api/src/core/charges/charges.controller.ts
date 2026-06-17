import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { CardChargeResponseDto } from './dto/card-charge-response.dto';

@ApiTags('Encaissements')
@ApiSecurity('api-key')
@Controller('charge')
@UseGuards(ApiKeyGuard)
export class ChargesController {
  constructor(
    private readonly chargesService: ChargesService,
    private readonly cardChargeService: CardChargeService,
  ) {}

  @Post('wave')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Lancer un encaissement direct Wave' })
  @ApiBody({ type: CreateWaveChargeDto })
  @ApiResponse({
    status: 201,
    description:
      'Encaissement initié (corps JSON renvoyé par la fonction edge Wave)',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Entrée invalide ou erreur API Wave',
  })
  async createWaveCharge(
    @Body() createChargeDto: CreateWaveChargeDto,
    @CurrentUser() user: AuthContext,
  ) {
    createChargeDto.organizationId = user.organizationId;
    createChargeDto.merchantId = user.merchantId;
    return this.chargesService.createWaveCharge(createChargeDto, user);
  }

  @Post('mtn')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Lancer un encaissement direct MTN MoMo',
    description:
      'Initie un RequestToPay MTN MoMo. Avec une clé API test, la transaction est marquée terminée dans le ledger sans appel au sandbox MTN.',
  })
  @ApiBody({ type: CreateMtnChargeDto })
  @ApiResponse({
    status: 201,
    description: 'Encaissement MTN initié (RequestToPay)',
    schema: { type: 'object', additionalProperties: true },
  })
  async createMtnCharge(
    @Body() createChargeDto: CreateMtnChargeDto,
    @CurrentUser() user: AuthContext,
  ) {
    createChargeDto.organizationId = user.organizationId;
    createChargeDto.merchantId = user.merchantId;
    return this.chargesService.createMtnCharge(createChargeDto, user);
  }

  @Post('card')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Créer un encaissement carte (client_secret)',
    description:
      'Crée un encaissement carte embarqué et renvoie le client_secret pour votre interface de paiement.',
  })
  @ApiResponse({
    status: 201,
    description: 'Encaissement carte créé',
    type: CardChargeResponseDto,
  })
  @ApiBody({ type: CreateCardChargeDto })
  createCardCharge(
    @Body() createDto: CreateCardChargeDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.cardChargeService.create(createDto, user);
  }

  @Get('card/:id')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Obtenir un encaissement carte' })
  @ApiParam({ name: 'id', description: 'Card payment id (pi_...)' })
  @ApiResponse({
    status: 200,
    description: 'Encaissement carte',
    type: CardChargeResponseDto,
  })
  getCardCharge(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.cardChargeService.findOne(id, user);
  }

  @Post('card/:id/cancel')
  @ApiLomiAccountHeader()
  @ApiOperation({ summary: 'Annuler un encaissement carte' })
  @ApiParam({ name: 'id', description: 'Card payment id (pi_...)' })
  @ApiResponse({ status: 200, description: 'Encaissement carte annulé' })
  cancelCardCharge(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.cardChargeService.cancel(id, user);
  }
}
