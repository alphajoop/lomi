import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { MerchantResponseDto } from './dto/merchant-response.dto';
import { MerchantMrrResponseDto } from './dto/merchant-mrr-response.dto';
import { MerchantArrResponseDto } from './dto/merchant-arr-response.dto';
import { MerchantBalanceResponseDto } from './dto/merchant-balance-response.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { type CurrencyCode } from '../../utils/types/api';

@ApiTags('Merchants')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get merchant details',
    description:
      'Returns merchant profile and metrics (MRR, ARR, predicted per-customer LTV) for the organization linked to the API key. Metrics are refreshed daily and on subscription changes.',
  })
  @ApiParam({ name: 'id', description: 'Merchant UUID' })
  @ApiResponse({ status: 200, type: MerchantResponseDto })
  @ApiResponse({ status: 403, description: 'Merchant ID mismatch' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  getDetails(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.merchantsService.getDetails(id, user);
  }

  @Get(':id/mrr')
  @ApiOperation({
    summary: 'Get merchant MRR',
    description:
      'Monthly Recurring Revenue for the organization linked to the API key (org default currency). Scoped to that org even if the merchant belongs to multiple organizations.',
  })
  @ApiParam({ name: 'id', description: 'Merchant UUID' })
  @ApiResponse({ status: 200, type: MerchantMrrResponseDto })
  getMrr(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.merchantsService.getMrr(id, user);
  }

  @Get(':id/arr')
  @ApiOperation({
    summary: 'Get merchant ARR',
    description:
      'Annual Recurring Revenue (MRR × 12) for the organization linked to the API key (org default currency). Scoped to that org even if the merchant belongs to multiple organizations.',
  })
  @ApiParam({ name: 'id', description: 'Merchant UUID' })
  @ApiResponse({ status: 200, type: MerchantArrResponseDto })
  getArr(@Param('id') id: string, @CurrentUser() user: AuthContext) {
    return this.merchantsService.getArr(id, user);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get merchant account balance for a currency' })
  @ApiParam({ name: 'id', description: 'Merchant UUID' })
  @ApiQuery({
    name: 'currency_code',
    required: true,
    enum: ['XOF', 'USD', 'EUR'],
  })
  @ApiResponse({ status: 200, type: MerchantBalanceResponseDto })
  @ApiResponse({ status: 400, description: 'Missing currency_code' })
  getBalance(
    @Param('id') id: string,
    @Query('currency_code') currencyCode: CurrencyCode,
    @CurrentUser() user: AuthContext,
  ) {
    return this.merchantsService.getBalance(id, user, currencyCode);
  }
}
