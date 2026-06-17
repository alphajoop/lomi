import {
  Controller,
  Get,
  Param,
  Query,
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
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApiLomiAccountHeader } from '../common/decorators/api-lomi-account-header.decorator';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Lister les transactions',
    description:
      "Renvoie les transactions de l'organisation du marchand authentifié avec filtres avancés. Les transactions sont créées par le système lors du traitement des paiements.",
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'Filtrer par code de fournisseur de paiement',
    type: String,
    example: 'WAVE',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtrer par statut de transaction (séparés par des virgules pour plusieurs valeurs)',
    type: String,
    example: 'completed,pending',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description:
      'Filtrer par type de transaction (séparés par des virgules pour plusieurs valeurs)',
    type: String,
    example: 'payment,refund',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    description:
      'Filtrer par code devise (séparés par des virgules pour plusieurs valeurs)',
    type: String,
    example: 'XOF,USD',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    description:
      'Filtrer par code de moyen de paiement (séparés par des virgules pour plusieurs valeurs)',
    type: String,
    example: 'MOBILE_MONEY,CARDS',
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
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'À partir de cette date (format ISO 8601)',
    type: String,
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: "Jusqu'à cette date (format ISO 8601)",
    type: String,
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'isPos',
    required: false,
    description: 'Uniquement les transactions points de vente (TPV)',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des transactions',
    type: TransactionResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('currency') currency?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe)
    pageSize?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isPos') isPos?: boolean,
  ) {
    // Parse comma-separated values into arrays
    const statusArray = status ? status.split(',') : undefined;
    const typeArray = type ? type.split(',') : undefined;
    const currencyArray = currency ? currency.split(',') : undefined;
    const paymentMethodArray = paymentMethod
      ? paymentMethod.split(',')
      : undefined;

    return this.transactionsService.findAll(
      user,
      provider,
      statusArray,
      typeArray,
      currencyArray,
      paymentMethodArray,
      page,
      pageSize,
      startDate,
      endDate,
      isPos,
    );
  }

  @Get(':id')
  @ApiLomiAccountHeader()
  @ApiOperation({
    summary: 'Obtenir une transaction par ID',
    description:
      "Renvoie une transaction. Réponse 404 si elle n'existe pas ou n'est pas accessible avec cette clé API.",
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la transaction',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la transaction',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction introuvable ou accès refusé',
  })
  @ApiResponse({
    status: 401,
    description: 'Clé API invalide ou manquante',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.transactionsService.findOne(id, user);
  }
}
