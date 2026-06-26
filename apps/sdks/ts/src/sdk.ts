/**
 * Main lomi. SDK class
 * AUTO-GENERATED - Do not edit manually
 */

import type { LomiConfig } from './config.js';
import { DEFAULT_CONFIG } from './config.js';
import { OpenAPI } from './generated/index.js';

// Import all generated services
import {
  AccountsService,
  ChargesService,
  CheckoutSessionsService,
  CustomerSubscriptionsService,
  CustomersService,
  DiscountCouponsService,
  DisputesService,
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
  public readonly accounts: typeof AccountsService;
  public readonly charges: typeof ChargesService;
  public readonly checkoutSessions: typeof CheckoutSessionsService;
  public readonly customerSubscriptions: typeof CustomerSubscriptionsService;
  public readonly customers: typeof CustomersService;
  public readonly discountCoupons: typeof DiscountCouponsService;
  public readonly disputes: typeof DisputesService;
  public readonly merchants: typeof MerchantsService;
  public readonly meters: typeof MetersService;
  public readonly organization: typeof OrganizationService;
  public readonly organizations: typeof OrganizationsService;
  public readonly paymentLinks: typeof PaymentLinksService;
  public readonly paymentRequests: typeof PaymentRequestsService;
  public readonly payouts: typeof PayoutsService;
  public readonly products: typeof ProductsService;
  public readonly providers: typeof ProvidersService;
  public readonly refunds: typeof RefundsService;
  public readonly riskAssessments: typeof RiskAssessmentsService;
  public readonly settlements: typeof SettlementsService;
  public readonly subscriptions: typeof SubscriptionsService;
  public readonly transactions: typeof TransactionsService;
  public readonly usageBilling: typeof UsageBillingService;
  public readonly usageEvents: typeof UsageEventsService;
  public readonly usageSubscriptions: typeof UsageSubscriptionsService;
  public readonly webhookDeliveryLogs: typeof WebhookDeliveryLogsService;
  public readonly webhooks: typeof WebhooksService;

  /**
   * Initialize the lomi. SDK
   */
  constructor(config: LomiConfig) {
    const baseUrl = config.environment === 'test' 
      ? 'https://sandbox.api.lomi.africa'
      : config.baseUrl || DEFAULT_CONFIG.baseUrl;

    // Configure OpenAPI client
    OpenAPI.BASE = baseUrl;
    OpenAPI.HEADERS = {
      'X-API-KEY': config.apiKey,
      ...config.headers,
    };

    // Assign all generated services
    this.accounts = AccountsService;
    this.charges = ChargesService;
    this.checkoutSessions = CheckoutSessionsService;
    this.customerSubscriptions = CustomerSubscriptionsService;
    this.customers = CustomersService;
    this.discountCoupons = DiscountCouponsService;
    this.disputes = DisputesService;
    this.merchants = MerchantsService;
    this.meters = MetersService;
    this.organization = OrganizationService;
    this.organizations = OrganizationsService;
    this.paymentLinks = PaymentLinksService;
    this.paymentRequests = PaymentRequestsService;
    this.payouts = PayoutsService;
    this.products = ProductsService;
    this.providers = ProvidersService;
    this.refunds = RefundsService;
    this.riskAssessments = RiskAssessmentsService;
    this.settlements = SettlementsService;
    this.subscriptions = SubscriptionsService;
    this.transactions = TransactionsService;
    this.usageBilling = UsageBillingService;
    this.usageEvents = UsageEventsService;
    this.usageSubscriptions = UsageSubscriptionsService;
    this.webhookDeliveryLogs = WebhookDeliveryLogsService;
    this.webhooks = WebhooksService;
  }

  /**
   * Update the API key
   */
  setApiKey(apiKey: string): void {
    OpenAPI.HEADERS = {
      ...OpenAPI.HEADERS,
      'X-API-KEY': apiKey,
    };
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return OpenAPI.BASE;
  }
}
