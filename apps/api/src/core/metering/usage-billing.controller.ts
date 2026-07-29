import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  CurrentUser,
  type AuthContext,
} from '../common/decorators/current-user.decorator';
import { environmentFromAuth } from '../common/auth-environment';
import { BillingService } from './billing.service';
import { UsageCreditsService } from './usage-credits.service';
import { EntitlementsService } from './entitlements.service';

@ApiTags('Usage billing')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('usage-billing')
export class UsageBillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly creditsService: UsageCreditsService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  @Get('periods')
  @ApiOperation({ summary: 'List usage billing periods' })
  @ApiQuery({ name: 'subscription_id', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  listPeriods(
    @CurrentUser() user: AuthContext,
    @Query('subscription_id') subscriptionId?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.billingService.listBillingPeriods(
      user,
      subscriptionId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 50,
    );
  }

  @Get('subscriptions/:subscriptionId/usage')
  @ApiOperation({ summary: 'Get meter usage for a subscription' })
  getSubscriptionUsage(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() user: AuthContext,
  ) {
    return this.billingService.getSubscriptionUsage(subscriptionId, user);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Combined MRR + usage + one-time revenue metrics' })
  @ApiQuery({ name: 'start_date', required: true })
  @ApiQuery({ name: 'end_date', required: true })
  getRevenue(
    @CurrentUser() user: AuthContext,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.billingService.getCombinedRevenue(
      user.organizationId,
      startDate,
      endDate,
      environmentFromAuth(user),
    );
  }

  @Post('credits')
  @ApiOperation({
    summary: 'Credit prepaid usage units to a customer meter wallet',
  })
  creditWallet(
    @Body() body: CreditWalletDto,
    @CurrentUser() user: AuthContext,
  ) {
    return this.creditsService.credit(user, body);
  }

  @Post('entitlements')
  @ApiOperation({ summary: 'Create or update a plan entitlement feature' })
  createEntitlement(
    @CurrentUser() user: AuthContext,
    @Body()
    body: { feature_key: string; name: string; description?: string },
  ) {
    return this.entitlementsService.create(user, body);
  }

  @Get('entitlements/check')
  @ApiOperation({ summary: 'Check if a customer has an active entitlement' })
  checkEntitlement(
    @CurrentUser() user: AuthContext,
    @Query('customer_id') customerId: string,
    @Query('feature_key') featureKey: string,
  ) {
    return this.entitlementsService.check(user, customerId, featureKey);
  }
}
