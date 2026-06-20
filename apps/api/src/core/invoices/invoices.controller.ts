import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@ApiTags('Factures')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une facture' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthContext) {
    return this.invoicesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les factures' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, type: InvoiceResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: AuthContext,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.invoicesService.findAll(
      user,
      status,
      customerId,
      limit,
      offset,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une facture' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.invoicesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une facture' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.invoicesService.update(id, dto, user);
  }

  @Post(':id/checkout-session')
  @ApiOperation({
    summary: 'Créer ou récupérer une session de paiement de facture',
  })
  @ApiParam({ name: 'id', type: String })
  createCheckoutSession(
    @Param('id') id: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.invoicesService.createCheckoutSession(id, user);
  }
}
