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
import { DashboardInvoicingSpiService } from './dashboard-invoicing-spi.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/invoicing/spi')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
@DashboardPermission('payment.charge')
export class DashboardInvoicingSpiController {
  constructor(
    private readonly invoicingSpiService: DashboardInvoicingSpiService,
  ) {}

  @Post('request-payment')
  @ApiOperation({
    summary: 'Send SPI request-to-pay for a single invoice (category 401)',
  })
  requestPayment(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      invoiceId: string;
      payeurAlias?: string;
    },
  ) {
    return this.invoicingSpiService.requestPayment(user, body);
  }

  @Post('bulk-request-payment')
  @ApiOperation({
    summary: 'Send SPI bulk request-to-pay for multiple invoices',
  })
  bulkRequestPayment(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      invoiceIds: string[];
    },
  ) {
    return this.invoicingSpiService.bulkRequestPayment(user, body);
  }

  @Get('payments/:invoiceId')
  @ApiOperation({ summary: 'Poll invoice SPI payment status' })
  getPaymentStatus(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.invoicingSpiService.getPaymentStatus(user, invoiceId);
  }
}
