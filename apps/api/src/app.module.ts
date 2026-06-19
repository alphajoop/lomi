import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalJsonExceptionFilter } from './core/filters/json-exception.filter';
import { THROTTLE_LIMIT, THROTTLE_TTL_MS } from './config/http.constants';
import { AgentModule } from './agent/agent.module';
import { SupabaseModule } from './utils/supabase/supabase.module';
import { StripeModule } from './utils/stripe/stripe.module';
import { TransactionsModule } from './core/transactions/transactions.module';
import { AccountsModule } from './core/accounts/accounts.module';
import { OrganizationsModule } from './core/organizations/organizations.module';
import { CustomersModule } from './core/customers/customers.module';
import { PaymentRequestsModule } from './core/payment-requests/payment-requests.module';
import { RefundsModule } from './core/refunds/refunds.module';
import { ProductsModule } from './core/products/products.module';
import { SubscriptionsModule } from './core/subscriptions/subscriptions.module';
import { DiscountCouponsModule } from './core/discount-coupons/discount-coupons.module';
import { CheckoutSessionsModule } from './core/checkout-sessions/checkout-sessions.module';
import { PaymentLinksModule } from './core/payment-links/payment-links.module';
import { PayoutsModule } from './core/payouts/payouts.module';
import { DisputesModule } from './core/disputes/disputes.module';
import { RadarModule } from './core/radar/radar.module';
import { SettlementsModule } from './core/settlements/settlements.module';
import { WebhookDeliveryLogsModule } from './core/webhook-delivery-logs/webhook-delivery-logs.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ApiLoggingInterceptor } from './core/interceptors/api-logging.interceptor';
import { ChargesModule } from './core/charges/charges.module';
import { MerchantsModule } from './core/merchants/merchants.module';
import { ProvidersModule } from './core/providers/providers.module';
import { CustomerSubscriptionsModule } from './core/customer-subscriptions/customer-subscriptions.module';
import { InvoicesModule } from './core/invoices/invoices.module';
import { MeteringModule } from './core/metering/metering.module';
import { MeModule } from './core/me/me.module';
import { CliModule } from './cli/cli.module';
import { CustomerPortalModule } from './core/customer-portal/customer-portal.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';

const logger = new Logger('RedisConfig');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLE_TTL_MS, // 15 minutes
        limit: THROTTLE_LIMIT,
      },
    ]),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.UPSTASH_REDIS_URL;

        // If no Redis URL, fall back to localhost (dev mode)
        if (!redisUrl) {
          logger.warn(
            'UPSTASH_REDIS_URL not set. Using localhost Redis. Webhooks will fall back to sync mode if unavailable.',
          );
          return {
            connection: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
              retryStrategy: (times: number) => {
                if (times > 3) {
                  logger.error(
                    'Redis connection failed after 3 retries. Webhooks will use sync fallback.',
                  );
                  return null; // Stop retrying, triggers fallback
                }
                return Math.min(times * 200, 2000);
              },
            },
          };
        }

        // Parse Upstash Redis URL (supports both redis:// and rediss://)
        // Format: rediss://default:PASSWORD@HOST:PORT
        logger.log('Connecting to Upstash Redis...');

        try {
          const url = new URL(redisUrl);
          const host = url.hostname;
          const port = parseInt(url.port || '6379');
          // IMPORTANT: URL-decode the password (it may contain special chars)
          const password = decodeURIComponent(url.password);
          const useTls = url.protocol === 'rediss:';

          logger.log(`Redis host: ${host}, port: ${port}, TLS: ${useTls}`);

          return {
            connection: {
              host,
              port,
              password,
              maxRetriesPerRequest: null, // Required for BullMQ
              tls: useTls ? {} : undefined,
              retryStrategy: (times: number) => {
                if (times > 10) {
                  logger.error(`Redis failed after ${times} retries.`);
                  return null;
                }
                return Math.min(times * 500, 3000);
              },
            },
          };
        } catch (parseError) {
          logger.error(`Failed to parse UPSTASH_REDIS_URL: ${parseError}`);
          return {
            connection: {
              host: 'localhost',
              port: 6379,
              maxRetriesPerRequest: null,
            },
          };
        }
      },
    }),
    SupabaseModule,
    StripeModule,
    AccountsModule,
    OrganizationsModule,
    TransactionsModule,
    CustomersModule,
    PaymentRequestsModule,
    RefundsModule,
    ProductsModule,
    SubscriptionsModule,
    DiscountCouponsModule,
    CheckoutSessionsModule,
    PaymentLinksModule,
    PayoutsModule,
    DisputesModule,
    RadarModule,
    SettlementsModule,
    WebhookDeliveryLogsModule,
    WebhooksModule,
    ChargesModule,
    MerchantsModule,
    ProvidersModule,
    CustomerSubscriptionsModule,
    InvoicesModule,
    MeteringModule,
    AgentModule,
    MeModule,
    CliModule,
    CustomerPortalModule,
    HealthModule,
    DashboardModule,
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
export class AppModule {}
