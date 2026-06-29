import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseSessionGuard } from '../core/common/guards/supabase-session.guard';
import { OrganizationContextGuard } from '../core/common/guards/organization-context.guard';
import { InternalApiKeyGuard } from '../core/common/guards/internal-api-key.guard';
import { DashboardMeController } from './dashboard-me.controller';
import { DashboardMeService } from './dashboard-me.service';
import { DashboardProductsController } from './dashboard-products.controller';
import { DashboardProductsService } from './dashboard-products.service';
import { DashboardCustomersController } from './dashboard-customers.controller';
import { DashboardCustomersService } from './dashboard-customers.service';
import { DashboardNetworkController } from './dashboard-network.controller';
import { DashboardNetworkService } from './dashboard-network.service';
import { InternalJobsController } from './internal-jobs.controller';
import { InternalJobsService } from './internal-jobs.service';
import { InternalSpiController } from './internal-spi.controller';
import { DashboardPosSpiController } from './dashboard-pos-spi.controller';
import { DashboardPosSpiService } from './dashboard-pos-spi.service';
import { DashboardInvoicingSpiController } from './dashboard-invoicing-spi.controller';
import { DashboardInvoicingSpiService } from './dashboard-invoicing-spi.service';
import { DashboardPayoutsSpiController } from './dashboard-payouts-spi.controller';
import { DashboardPayoutsSpiService } from './dashboard-payouts-spi.service';
import { DashboardSpiStatusController } from './dashboard-spi-status.controller';
import { DashboardSpiStatusService } from './dashboard-spi-status.service';
import { SpiModule } from '../core/spi/spi.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'lomi-jobs',
    }),
    SpiModule,
  ],
  controllers: [
    DashboardMeController,
    DashboardProductsController,
    DashboardCustomersController,
    DashboardNetworkController,
    DashboardPosSpiController,
    DashboardInvoicingSpiController,
    DashboardPayoutsSpiController,
    DashboardSpiStatusController,
    InternalJobsController,
    InternalSpiController,
  ],
  providers: [
    DashboardMeService,
    DashboardProductsService,
    DashboardCustomersService,
    DashboardNetworkService,
    DashboardPosSpiService,
    DashboardInvoicingSpiService,
    DashboardPayoutsSpiService,
    DashboardSpiStatusService,
    InternalJobsService,
    SupabaseSessionGuard,
    OrganizationContextGuard,
    InternalApiKeyGuard,
  ],
  exports: [
    DashboardProductsService,
    DashboardCustomersService,
    DashboardNetworkService,
  ],
})
export class DashboardModule {}
