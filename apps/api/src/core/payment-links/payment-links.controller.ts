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
import { PaymentLinksService } from './payment-links.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { PaymentLinkResponseDto } from './dto/payment-link-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';

@ApiTags('Liens de paiement')
@ApiSecurity('api-key')
@ApiExtraModels(PaymentLinkResponseDto)
@UseGuards(ApiKeyGuard)
@Controller('payment-links')
export class PaymentLinksController {
  constructor(private readonly service: PaymentLinksService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un lien de paiement',
    description:
      'Crée un lien de paiement partageable : produit (lien produit) ou montant fixe (lien instantané). Les liens produit référencent un produit et un prix optionnel ; les liens instantanés ont un montant fixe.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lien de paiement créé avec succès',
    type: PaymentLinkResponseDto,
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
      required: ['link_type', 'title', 'currency_code'],
      properties: {
        link_type: { type: 'string', enum: ['product', 'instant'] },
        title: { type: 'string' },
        currency_code: {
          type: 'string',
          enum: ['XOF', 'USD', 'EUR'],
        },
        description: { type: 'string' },
        amount: { type: 'number' },
        product_id: { type: 'string', format: 'uuid' },
        price_id: { type: 'string', format: 'uuid' },
        allow_coupon_code: { type: 'boolean' },
        allow_quantity: { type: 'boolean' },
        require_billing_address: {
          type: 'boolean',
          description: 'When true, show and require billing address on checkout.',
        },
        require_email: {
          type: 'boolean',
          description:
            'When true, show and require customer email. Default true when unset.',
          default: true,
        },
        require_phone: {
          type: 'boolean',
          description:
            'When true, show and require customer phone. Default false when unset.',
          default: false,
        },
        fields: {
          type: 'array',
          description:
            'Optional ordered checkout field schema. When provided, overrides require_* booleans.',
          items: { type: 'object', additionalProperties: true },
        },
        expires_at: { type: 'string', format: 'date-time' },
        success_url: { type: 'string', format: 'uri' },
        cancel_url: { type: 'string', format: 'uri' },
        metadata: { type: 'object', additionalProperties: true },
      },
    },
    examples: {
      instant: {
        summary: 'Lien instantané (montant fixe)',
        value: {
          link_type: 'instant',
          title: 'Invoice INV-001',
          currency_code: 'XOF',
          amount: 15000,
        },
      },
      product: {
        summary: 'Lien produit',
        value: {
          link_type: 'product',
          title: 'Premium plan',
          currency_code: 'XOF',
          product_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  create(
    @Body() createDto: CreatePaymentLinkDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.service.create(createDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les liens de paiement',
    description:
      "Renvoie tous les liens de l'organisation avec pagination et filtres optionnels (type, actif).",
  })
  @ApiQuery({
    name: 'linkType',
    required: false,
    description: 'Filtrer par type de lien',
    enum: ['product', 'instant'],
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filtrer par statut actif',
    type: Boolean,
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
    description: 'Liste paginée de liens de paiement',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(PaymentLinkResponseDto) },
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
    @Query('linkType') linkType?: string,
    @Query('isActive') isActiveStr?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const isActive =
      isActiveStr === 'true'
        ? true
        : isActiveStr === 'false'
          ? false
          : undefined;
    return this.service.findAll(user, linkType, isActive, limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un lien de paiement par ID',
    description: 'Renvoie le détail d’un lien (URL, configuration et statut).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du lien de paiement',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du lien',
    type: PaymentLinkResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lien introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.service.findOne(id, user);
  }
}
