import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangePlanSubscriptionDto } from './dto/change-plan-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';

@ApiTags('Abonnements')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les abonnements',
    description:
      "Renvoie tous les abonnements de l'organisation du marchand authentifié. Les abonnements sont créés automatiquement lorsque les clients effectuent des paiements récurrents.",
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
    description: 'Liste des abonnements',
    type: SubscriptionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe)
    pageSize?: number,
  ) {
    return this.subscriptionsService.findAll(user, page, pageSize);
  }

  @Get('customer/:customerId')
  @ApiOperation({
    summary: 'Abonnements d’un client',
    description:
      "Renvoie les abonnements d'un client. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'customerId',
    description: 'UUID du client',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements du client',
    type: SubscriptionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Client introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.subscriptionsService.findByCustomer(customerId, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un abonnement par ID',
    description:
      "Renvoie un abonnement. Réponse 404 s'il n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de l’abonnement',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de l’abonnement',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Abonnement introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.subscriptionsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un abonnement',
    description:
      'Met à jour le statut ou les métadonnées (ex. pause). Les champs tarifaires restent gérés par le système.',
  })
  @ApiParam({ name: 'id', description: 'UUID de l’abonnement' })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis à jour',
    type: SubscriptionResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.subscriptionsService.update(id, updateDto, user);
  }

  @Post(':id/uncancel')
  @ApiOperation({
    summary: 'Annuler une résiliation planifiée',
    description:
      'Retire une résiliation planifiée en fin de période (`cancel_at_period_end`).',
  })
  @ApiParam({ name: 'id', description: 'UUID de l’abonnement', type: String })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  uncancel(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.subscriptionsService.uncancel(id, user);
  }

  @Post(':id/change-plan')
  @ApiOperation({
    summary: 'Changer le plan tarifaire',
    description: 'Met à jour le price_id d’un abonnement actif.',
  })
  @ApiParam({ name: 'id', description: 'UUID de l’abonnement', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['price_id'],
      properties: {
        price_id: { type: 'string', format: 'uuid' },
      },
    },
    examples: {
      upgrade: {
        summary: 'Passer à un autre tarif',
        value: { price_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
      },
    },
  })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  changePlan(
    @Param('id') id: string,
    @Body() body: ChangePlanSubscriptionDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.subscriptionsService.changePlan(id, body.price_id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Résilier un abonnement',
    description:
      'Résilie un abonnement actif immédiatement ou en fin de période (`cancel_at_period_end`).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de l’abonnement',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement résilié avec succès',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Abonnement introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cancel_at_period_end: { type: 'boolean' },
        cancellation_reason: { type: 'string' },
      },
    },
    examples: {
      immediate: {
        summary: 'Résiliation immédiate',
        value: { cancellation_reason: 'Demande du client' },
      },
      atPeriodEnd: {
        summary: 'Résiliation en fin de période',
        value: {
          cancel_at_period_end: true,
          cancellation_reason: 'Demande du client',
        },
      },
    },
  })
  cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelSubscriptionDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.subscriptionsService.cancel(id, cancelDto, user);
  }
}
