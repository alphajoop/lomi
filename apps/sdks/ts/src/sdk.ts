/**
 * Main lomi. SDK class
 * AUTO-GENERATED - Do not edit manually
 */

import type { LomiConfig } from './config.js';
import { LomiClient } from './client.js';
import {
  AccountsService,
  ChargesService,
  CheckoutSessionsService,
  CustomersService,
  DiscountCouponsService,
  DisputesService,
  LogsService,
  MerchantsService,
  MetersService,
  OrganizationService,
  OrganizationsService,
  PaymentLinksService,
  PaymentRequestsService,
  PayoutsService,
  ProductsService,
  ProvidersService,
  RefundsService,
  RiskAssessmentsService,
  SettlementsService,
  SubscriptionsService,
  TransactionsService,
  UsageBillingService,
  UsageEventsService,
  UsageSubscriptionsService,
  WebhookDeliveryLogsService,
  WebhooksService,
} from './generated/index.js';

export class LomiSDK {
  private readonly client: LomiClient;

  public readonly accounts: AccountsService;
  public readonly charges: ChargesService;
  public readonly checkoutSessions: CheckoutSessionsService;
  public readonly customers: CustomersService;
  public readonly discountCoupons: DiscountCouponsService;
  public readonly disputes: DisputesService;
  public readonly logs: LogsService;
  public readonly merchants: MerchantsService;
  public readonly meters: MetersService;
  public readonly organization: OrganizationService;
  public readonly organizations: OrganizationsService;
  public readonly paymentLinks: PaymentLinksService;
  public readonly paymentRequests: PaymentRequestsService;
  public readonly payouts: PayoutsService;
  public readonly products: ProductsService;
  public readonly providers: ProvidersService;
  public readonly refunds: RefundsService;
  public readonly riskAssessments: RiskAssessmentsService;
  public readonly settlements: SettlementsService;
  public readonly subscriptions: SubscriptionsService;
  public readonly transactions: TransactionsService;
  public readonly usageBilling: UsageBillingService;
  public readonly usageEvents: UsageEventsService;
  public readonly usageSubscriptions: UsageSubscriptionsService;
  public readonly webhookDeliveryLogs: WebhookDeliveryLogsService;
  public readonly webhooks: WebhooksService;

  constructor(config: LomiConfig) {
    this.client = new LomiClient(config);

    this.accounts = new AccountsService(this.client);
    this.charges = new ChargesService(this.client);
    this.checkoutSessions = new CheckoutSessionsService(this.client);
    this.customers = new CustomersService(this.client);
    this.discountCoupons = new DiscountCouponsService(this.client);
    this.disputes = new DisputesService(this.client);
    this.logs = new LogsService(this.client);
    this.merchants = new MerchantsService(this.client);
    this.meters = new MetersService(this.client);
    this.organization = new OrganizationService(this.client);
    this.organizations = new OrganizationsService(this.client);
    this.paymentLinks = new PaymentLinksService(this.client);
    this.paymentRequests = new PaymentRequestsService(this.client);
    this.payouts = new PayoutsService(this.client);
    this.products = new ProductsService(this.client);
    this.providers = new ProvidersService(this.client);
    this.refunds = new RefundsService(this.client);
    this.riskAssessments = new RiskAssessmentsService(this.client);
    this.settlements = new SettlementsService(this.client);
    this.subscriptions = new SubscriptionsService(this.client);
    this.transactions = new TransactionsService(this.client);
    this.usageBilling = new UsageBillingService(this.client);
    this.usageEvents = new UsageEventsService(this.client);
    this.usageSubscriptions = new UsageSubscriptionsService(this.client);
    this.webhookDeliveryLogs = new WebhookDeliveryLogsService(this.client);
    this.webhooks = new WebhooksService(this.client);
  }

  /** Rotate the secret API key on this client instance. */
  setApiKey(apiKey: string): void {
    this.client.setApiKey(apiKey);
  }

  /** Current API base URL for this client instance. */
  getBaseUrl(): string {
    return this.client.baseUrl;
  }
}
