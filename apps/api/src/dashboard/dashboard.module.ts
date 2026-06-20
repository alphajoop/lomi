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
import { DashboardPosSpiController } from './dashboard-pos-spi.controller';
import { DashboardPosSpiService } from './dashboard-pos-spi.service';
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
    InternalJobsController,
  ],
  providers: [
    DashboardMeService,
    DashboardProductsService,
    DashboardCustomersService,
    DashboardNetworkService,
    DashboardPosSpiService,
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
