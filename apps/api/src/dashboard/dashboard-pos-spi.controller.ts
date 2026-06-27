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
import { DashboardPosSpiService } from './dashboard-pos-spi.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/pos/spi')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
@DashboardPermission('payment.charge')
export class DashboardPosSpiController {
  constructor(private readonly posSpiService: DashboardPosSpiService) {}

  @Post('qr-payment')
  @ApiOperation({ summary: 'Initiate POS SPI EMV QR payment' })
  initQrPayment(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      amount: number;
      currency?: string;
      productId?: string;
      metadata?: Record<string, unknown>;
      checkoutSessionId?: string;
    },
  ) {
    return this.posSpiService.initQrPayment(user, body);
  }

  @Post('request-payment')
  @ApiOperation({ summary: 'Initiate POS SPI request-to-pay from scanned customer alias' })
  initRequestToPay(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      amount: number;
      payeurAlias: string;
      currency?: string;
      productId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.posSpiService.initRequestToPay(user, body);
  }

  @Get('payments/:checkoutSessionId')
  @ApiOperation({ summary: 'Poll POS SPI payment status' })
  getPaymentStatus(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Param('checkoutSessionId', ParseUUIDPipe) checkoutSessionId: string,
  ) {
    return this.posSpiService.getPaymentStatus(user, checkoutSessionId);
  }
}
