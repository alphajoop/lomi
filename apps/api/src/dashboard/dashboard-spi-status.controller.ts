import {
  Body,
  Controller,
  Get,
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
import { DashboardSpiStatusService } from './dashboard-spi-status.service';

@ApiExcludeController()
@ApiTags('Dashboard')
@Controller('dashboard/v1/organizations/:organizationId/spi')
@UseGuards(SupabaseSessionGuard, OrganizationContextGuard)
@DashboardPermission('payment.charge')
export class DashboardSpiStatusController {
  constructor(private readonly spiStatusService: DashboardSpiStatusService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Read-only SPI merchant connection and account status',
  })
  getStatus(@CurrentDashboardUser() user: DashboardUserContext) {
    return this.spiStatusService.getStatus(user.organizationId);
  }

  @Post('qr-payload')
  @ApiOperation({
    summary: 'Generate EMV QR payload for catalog/static QR codes',
  })
  generateQrPayload(
    @CurrentDashboardUser() user: DashboardUserContext,
    @Body()
    body: {
      amount?: number;
      referenceLabel?: string;
      qrType?: 'STATIC' | 'DYNAMIC';
    },
  ) {
    return this.spiStatusService.generateQrPayload(user.organizationId, body);
  }
}
