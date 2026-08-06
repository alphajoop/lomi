/* @proprietary license */

/**
 * Application graph used only by `openapi:export`: no BullMQ / Redis bootstrap.
 */

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './utils/supabase/supabase.module';
import { TransactionsModule } from './core/transactions/transactions.module';
import { AccountsModule } from './core/accounts/accounts.module';
import { OrganizationsModule } from './core/organizations/organizations.module';
import { MerchantsModule } from './core/merchants/merchants.module';
import { ProvidersModule } from './core/providers/providers.module';
import { CustomersModule } from './core/customers/customers.module';
import { PaymentRequestsModule } from './core/payment-requests/payment-requests.module';
import { RefundsModule } from './core/refunds/refunds.module';
import { ProductsModule } from './core/products/products.module';
import { SubscriptionsOpenApiModule } from './core/subscriptions/subscriptions-open-api.module';
import { DiscountCouponsModule } from './core/discount-coupons/discount-coupons.module';
import { CheckoutSessionsModule } from './core/checkout-sessions/checkout-sessions.module';
import { BnplModule } from './core/bnpl/bnpl.module';
import { PaymentLinksModule } from './core/payment-links/payment-links.module';
import { PayoutsModule } from './core/payouts/payouts.module';
import { DisputesModule } from './core/disputes/disputes.module';
import { RadarModule } from './core/radar/radar.module';
import { SettlementsModule } from './core/settlements/settlements.module';
import { WebhookDeliveryLogsModule } from './core/webhook-delivery-logs/webhook-delivery-logs.module';
import { LogsModule } from './core/logs/logs.module';
import { WebhooksOpenApiModule } from './webhooks/webhooks-open-api.module';
import { ApiLoggingInterceptor } from './core/interceptors/api-logging.interceptor';
import { ChargesModule } from './core/charges/charges.module';
import { MeteringOpenApiModule } from './core/metering/metering-open-api.module';
import { GlobalJsonExceptionFilter } from './core/filters/json-exception.filter';
import { THROTTLE_LIMIT, THROTTLE_TTL_MS } from './config/http.constants';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLE_TTL_MS,
        limit: THROTTLE_LIMIT,
      },
    ]),
    EventEmitterModule.forRoot(),
    SupabaseModule,
    AccountsModule,
    OrganizationsModule,
    MerchantsModule,
    ProvidersModule,
    TransactionsModule,
    CustomersModule,
    PaymentRequestsModule,
    RefundsModule,
    ProductsModule,
    SubscriptionsOpenApiModule,
    DiscountCouponsModule,
    CheckoutSessionsModule,
    BnplModule,
    PaymentLinksModule,
    PayoutsModule,
    DisputesModule,
    RadarModule,
    SettlementsModule,
    WebhookDeliveryLogsModule,
    LogsModule,
    WebhooksOpenApiModule,
    ChargesModule,
    MeteringOpenApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalJsonExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiLoggingInterceptor,
    },
  ],
})
export class OpenApiExportModule {}
