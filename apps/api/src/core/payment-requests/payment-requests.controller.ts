import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
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
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentRequestsService } from './payment-requests.service';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentRequestResponseDto } from './dto/payment-request-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
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

@ApiTags('Demandes de paiement')
@ApiSecurity('api-key')
@ApiExtraModels(PaymentRequestResponseDto)
@UseGuards(ApiKeyGuard)
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private readonly service: PaymentRequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une demande de paiement',
    description:
      'Crée une demande de paiement pour un client. Elle a une date d’expiration et peut être suivie jusqu’à réussite ou expiration.',
  })
  @ApiResponse({
    status: 201,
    description: 'Demande de paiement créée avec succès',
    type: PaymentRequestResponseDto,
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
    schema: {
      type: 'object',
      required: ['amount', 'currency_code', 'expiry_date'],
      properties: {
        amount: { type: 'number' },
        currency_code: {
          type: 'string',
          enum: ['XOF', 'USD', 'EUR'],
        },
        description: { type: 'string' },
        customer_id: { type: 'string', format: 'uuid' },
        expiry_date: { type: 'string', format: 'date-time' },
        payment_reference: { type: 'string' },
        metadata: { type: 'object', additionalProperties: true },
      },
    },
    examples: {
      default: {
        summary: 'Demande avec expiration',
        value: {
          amount: 25000,
          currency_code: 'XOF',
          description: 'Honoraires conseil, mars',
          expiry_date: '2026-12-31T23:59:59.000Z',
          payment_reference: 'INV-2026-042',
        },
      },
    },
  })
  @Throttle({
    default: { limit: WRITE_THROTTLE_LIMIT, ttl: WRITE_THROTTLE_TTL_MS },
  })
  create(
    @Body() createDto: CreatePaymentRequestDto,
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
    summary: 'Lister les demandes de paiement',
    description:
      "Renvoie toutes les demandes de l'organisation avec pagination et filtres optionnels (statut, client).",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par statut',
    enum: ['pending', 'completed', 'failed', 'expired'],
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    description: 'Filtrer par ID client',
    type: String,
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
    description: 'Liste paginée de demandes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(PaymentRequestResponseDto) },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.service.findAll(user, status, customerId, limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir une demande de paiement par ID',
    description:
      'Renvoie le détail d’une demande (statut actuel, informations de paiement).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la demande',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la demande',
    type: PaymentRequestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Demande introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.service.findOne(id, user);
  }
}
