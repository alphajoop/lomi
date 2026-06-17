import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Headers,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CheckoutSessionsService } from './checkout-sessions.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import {
  WRITE_THROTTLE_LIMIT,
  WRITE_THROTTLE_TTL_MS,
} from '../../config/http.constants';
import {
  fingerprintRequestBody,
  normalizeIdempotencyKey,
} from '../../utils/idempotency-fingerprint';
import type { Response } from 'express';

@ApiTags('Sessions de paiement')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('checkout-sessions')
export class CheckoutSessionsController {
  constructor(private readonly service: CheckoutSessionsService) {}

  @Post()
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Créer une session de paiement',
    description:
      'Crée une page de paiement hébergée pour que le client finalise son achat. La session expire après 60 minutes par défaut. Renvoie un identifiant de session et une URL de redirection.',
  })
  @ApiResponse({
    status: 201,
    description: 'Session de paiement créée avec succès',
    type: CheckoutSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Entrée invalide ou erreur de validation',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  @ApiBody({
    description:
      'Charge utile de session : indiquez `amount` (et champs produit optionnels) ou `line_items` pour un panier multi-produits.',
    schema: {
      type: 'object',
      required: ['currency_code'],
      properties: {
        amount: { type: 'number', example: 10000 },
        currency_code: {
          type: 'string',
          enum: ['XOF', 'USD', 'EUR'],
          example: 'XOF',
        },
        title: { type: 'string' },
        description: { type: 'string' },
        customer_id: { type: 'string', format: 'uuid' },
        customer_email: { type: 'string', format: 'email' },
        customer_name: { type: 'string' },
        customer_phone: { type: 'string' },
        customer_city: { type: 'string' },
        customer_country: { type: 'string' },
        customer_address: { type: 'string' },
        customer_postal_code: { type: 'string' },
        product_id: { type: 'string', format: 'uuid' },
        price_id: { type: 'string', format: 'uuid' },
        subscription_id: { type: 'string', format: 'uuid' },
        allow_quantity: { type: 'boolean' },
        quantity: { type: 'number' },
        success_url: { type: 'string', format: 'uri' },
        cancel_url: { type: 'string', format: 'uri' },
        allow_coupon_code: { type: 'boolean' },
        require_billing_address: { type: 'boolean' },
        payment_link_id: { type: 'string', format: 'uuid' },
        metadata: { type: 'object', additionalProperties: true },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['price_id'],
            properties: {
              price_id: { type: 'string', format: 'uuid' },
              quantity: { type: 'number' },
              metadata: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    examples: {
      amount: {
        summary: 'Paiement à montant fixe',
        value: {
          currency_code: 'XOF',
          amount: 10000,
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        },
      },
      lineItems: {
        summary: 'Multi-produits (lignes)',
        value: {
          currency_code: 'XOF',
          line_items: [
            { price_id: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
          ],
          success_url: 'https://example.com/success',
        },
      },
    },
  })
  @Throttle({
    default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS },
  })
  create(
    @Body() createDto: CreateCheckoutSessionDto,
    @CurrentUser() user: AuthContext,
    @Headers('idempotency-key')
    idempotencyKey?: string | string[],
    @Res({ passthrough: true }) res?: Response,
  ) {
    const normalizedKey = normalizeIdempotencyKey(idempotencyKey);
    const dtoPayload = JSON.parse(JSON.stringify(createDto)) as Record<
      string,
      unknown
    >;
    const idempotency =
      normalizedKey !== null
        ? {
            key: normalizedKey,
            bodyHash: fingerprintRequestBody(dtoPayload),
          }
        : undefined;

    return this.service.create(createDto, user, idempotency).then((result) => {
      if (result.idempotencyCacheHit && res) {
        res.setHeader('Idempotency-Cache-Hit', 'true');
      }
      return result.data;
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les sessions de paiement',
    description:
      "Renvoie les sessions de l'organisation avec pagination et filtre de statut optionnel.",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtrer par statut de session (valeur checkout_session_status)',
    enum: ['open', 'completed', 'expired'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximal de résultats',
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Décalage pour la pagination',
    type: Number,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des sessions de paiement',
    type: CheckoutSessionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.service.findAll(
      user,
      status as 'open' | 'completed' | 'expired',
      limit,
      offset,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir une session de paiement par ID',
    description:
      'Renvoie le détail d’une session (statut, client et produits associés).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la session',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la session',
    type: CheckoutSessionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.service.findOne(id, user);
  }
}
