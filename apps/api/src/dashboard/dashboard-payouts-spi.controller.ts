import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { OrganizationContextGuard } from '../core/common/guards/organization-context.guard';
import { DashboardPermission } from './decorators/dashboard-permission.decorator';
import {
  CurrentDashboardUser,
  type DashboardUserContext,
} from './decorators/dashboard-user.decorator';
import { DashboardPayoutsSpiService } from './dashboard-payouts-spi.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/payouts/spi')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
@DashboardPermission('payout.create')
export class DashboardPayoutsSpiController {
  constructor(private readonly payoutsSpiService: DashboardPayoutsSpiService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate SPI merchant withdrawal' })
  createPayout(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      payoutMethodId: string;
      amount: number;
      currencyCode?: string;
      payoutPin?: string;
      payoutPinSession?: string;
    },
  ) {
    return this.payoutsSpiService.createSpiPayout(user, body);
  }

  @Get(':payoutId')
  @ApiOperation({ summary: 'Get SPI payout status' })
  getPayoutStatus(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Param('payoutId', ParseUUIDPipe) payoutId: string,
  ) {
    return this.payoutsSpiService.getPayoutStatus(user, payoutId);
  }
}
