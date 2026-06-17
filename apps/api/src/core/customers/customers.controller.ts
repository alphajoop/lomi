import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreatePortalLaunchSessionDto } from './dto/create-portal-launch-session.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PortalLaunchSessionResponseDto } from './dto/portal-launch-session-response.dto';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiSecurity('api-key')
@ApiExtraModels(
  CustomerResponseDto,
  TransactionResponseDto,
  PortalLaunchSessionResponseDto,
)
@UseGuards(ApiKeyGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Lister les clients',
    description:
      "Renvoie tous les clients de l'organisation du marchand authentifié. Filtres possibles : recherche, type de client et statut d'activité.",
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche par nom ou e-mail',
    type: String,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrer par type de client',
    enum: ['business', 'individual', 'all'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtrer par activité (active = au moins une transaction, inactive = aucune transaction)',
    enum: ['active', 'inactive', 'all'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: "Nombre d'éléments par page",
    type: Number,
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée de clients',
    schema: {
      properties: {
        customers: {
          type: 'array',
          items: { $ref: getSchemaPath(CustomerResponseDto) },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            pageSize: { type: 'number', example: 50 },
            totalCount: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('search') search?: string,
    @Query('type') type?: 'business' | 'individual' | 'all',
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe)
    pageSize?: number,
  ) {
    return this.customersService.findAll(
      user,
      search,
      type,
      status,
      page,
      pageSize,
    );
  }

  @Get(':id')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Obtenir un client par ID',
    description:
      "Renvoie un client. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du client',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du client',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Client introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.customersService.findOne(id, user);
  }

  @Post()
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Créer un client',
    description:
      'Crée un client dans votre organisation. Il est automatiquement rattaché à votre organisation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Client créé avec succès',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Données d'entrée invalides",
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', format: 'email' },
        phone_number: { type: 'string' },
        whatsapp_number: { type: 'string' },
        country: { type: 'string' },
        city: { type: 'string' },
        address: { type: 'string' },
        postal_code: { type: 'string' },
        is_business: { type: 'boolean' },
        metadata: { type: 'object', additionalProperties: true },
      },
    },
    examples: {
      minimal: {
        summary: 'Client minimal',
        value: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      },
    },
  })
  create(
    @Body() createDto: CreateCustomerDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.customersService.create(createDto, user);
  }

  @Patch(':id')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Mettre à jour un client',
    description:
      "Met à jour un client. N'envoyez que les champs à modifier. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du client',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Client mis à jour avec succès',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Client introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 400,
    description: "Données d'entrée invalides",
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone_number: { type: 'string' },
        whatsapp_number: { type: 'string' },
        country: { type: 'string' },
        city: { type: 'string' },
        address: { type: 'string' },
        postal_code: { type: 'string' },
        is_business: { type: 'boolean' },
        metadata: { type: 'object', additionalProperties: true },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.customersService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un client',
    description:
      "Retire un client de l'usage actif : il n'apparaît plus dans les listes ni les réponses de détail. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du client',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Client supprimé avec succès',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Client supprimé avec succès',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Client introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  remove(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.customersService.remove(id, user);
  }

  @Get(':id/portal-audit')
  @ApiOperation({
    summary: 'Hosted customer portal audit',
    description:
      'Liste les évènements portal (sessions, OTP, souscriptions self-service) pour ce client.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du client',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 50,
  })
  @ApiQuery({
    name: 'eventType',
    required: false,
    description: 'Filtre sur customer_portal_audit_events.event_type',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Chronologie paginée des évènements portal',
  })
  getPortalAudit(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe)
    pageSize?: number,
    @Query('eventType') eventType?: string,
  ) {
    return this.customersService.getPortalAudit(
      id,
      user,
      page,
      pageSize,
      eventType,
    );
  }

  @Get(':id/transactions')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Transactions du client',
    description:
      "Renvoie les transactions d'un client. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du client',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des transactions du client',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(TransactionResponseDto) },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Client introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  getTransactions(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.customersService.getTransactions(id, user);
  }

  @Post(':id/portal-launch-session')
  @ApiOperation({
    summary: 'Créer une session de lancement du portail client',
    description:
      'Génère un lien hébergé à usage unique vers le portail client pour un client de votre organisation. Destiné aux applications marchandes (backend) via clé API.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du client',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Session de lancement créée',
    type: PortalLaunchSessionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Client introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        return_url: { type: 'string', format: 'uri' },
        flow_type: {
          type: 'string',
          enum: ['portal_home', 'subscription_cancel', 'subscription_manage'],
        },
        flow_subscription_id: { type: 'string', format: 'uuid' },
        flow_after_completion_url: { type: 'string', format: 'uri' },
      },
    },
  })
  createPortalLaunchSession(
    @Param('id') id: string,
    @Body() body: CreatePortalLaunchSessionDto = {},
    @CurrentUser() user: AuthContext,
  ) {
    return this.customersService.createPortalLaunchSession(id, body, user);
  }
}
