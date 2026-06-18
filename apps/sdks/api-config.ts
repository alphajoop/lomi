export interface APIResourceConfig {
  tableName: string;
  path?: string;
  displayName?: string;
  idField?: string;
  enabled: boolean;
  operations?: {
    list?: boolean;
    get?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  tag?: string;
  description?: string;
}

export const API_RESOURCES: APIResourceConfig[] = [
  {
    tableName: 'accounts',
    enabled: true,
    tag: 'Accounts',
    idField: 'account_id',
    description:
      'Account balances - view organization account balances and SPI account information',
    operations: {
      list: true,
      get: true,
      create: false, // Accounts are system-managed
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'organizations',
    enabled: true,
    tag: 'Organizations',
    idField: 'organization_id',
    description:
      'Organization metrics - view MRR, ARR, total revenue, merchant lifetime value, and other organization metrics',
    operations: {
      list: true,
      get: true,
      create: false, // Organizations are system-managed
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'merchants',
    path: 'merchants',
    enabled: true,
    tag: 'Merchants',
    idField: 'merchant_id',
    description:
      'Merchant profile and cached organization metrics (MRR, ARR, LTV, balance)',
    operations: {
      list: false,
      get: true,
      create: false,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'customers',
    enabled: true,
    tag: 'Customers',
    description: 'Customer management - create and manage customer profiles',
    operations: {
      list: true,
      get: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  {
    tableName: 'payment_requests',
    enabled: true,
    tag: 'Payment Requests',
    idField: 'request_id',
    description: 'Payment requests - create payment intents and track status',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'transactions',
    enabled: true,
    tag: 'Transactions',
    idField: 'transaction_id',
    description:
      'Transaction history - view completed and pending transactions',
    operations: {
      list: true,
      get: true,
      create: false, // Transactions are created by the system, not by merchants
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'refunds',
    enabled: true,
    tag: 'Refunds',
    idField: 'refund_id',
    description: 'Refund management - process and track refunds',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'products',
    enabled: true,
    tag: 'Products',
    idField: 'product_id',
    description: 'Products - manage one-time and recurring products',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'subscriptions',
    enabled: true,
    tag: 'Subscriptions',
    idField: 'subscription_id',
    description:
      'Subscription management - create and manage recurring billing',
    operations: {
      list: true,
      get: true,
      create: false,
      update: true,
      delete: false,
    },
  },
  {
    tableName: 'discount_coupons',
    enabled: true,
    tag: 'Discount Coupons',
    idField: 'coupon_id',
    description: 'Discount coupons - create and manage promotional codes',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'checkout_sessions',
    enabled: true,
    tag: 'Checkout Sessions',
    idField: 'checkout_session_id',
    description: 'Checkout sessions - create hosted payment pages',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'payment_links',
    enabled: true,
    tag: 'Payment Links',
    idField: 'link_id',
    description: 'Payment links - shareable payment URLs',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'payouts',
    enabled: true,
    tag: 'Payouts',
    idField: 'payout_id',
    description: 'Payout management - transfer funds to beneficiaries',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'beneficiary_payouts',
    enabled: true,
    tag: 'Beneficiary Payouts',
    idField: 'payout_id',
    description: 'Beneficiary payouts - track individual payout transfers',
    operations: {
      list: true,
      get: true,
      create: true,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'providers',
    path: 'providers',
    enabled: true,
    tag: 'Providers',
    description: 'Payment provider connection status for the organization',
    operations: {
      list: true,
      get: false,
      create: false,
      update: false,
      delete: false,
    },
  },
  {
    tableName: 'customer_subscriptions',
    path: 'customer-subscriptions',
    enabled: true,
    tag: 'Customer Subscriptions',
    idField: 'subscription_id',
    description:
      'Per-customer subscription management (alias of subscriptions RPCs)',
    operations: {
      list: true,
      get: true,
      create: false,
      update: true,
      delete: true,
    },
  },
  {
    tableName: 'webhooks',
    enabled: true,
    tag: 'Webhooks',
    idField: 'webhook_id',
    description:
      'Webhook configuration - receive real-time event notifications',
    operations: {
      list: true,
      get: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  {
    tableName: 'webhook_delivery_logs',
    enabled: true,
    tag: 'Webhook Delivery Logs',
    idField: 'log_id',
    description: 'Webhook event log - history of webhook deliveries',
    operations: {
      list: true,
      get: true,
      create: false, // Logs are system-generated
      update: false,
      delete: false,
    },
  },
];

export function getEnabledResources(): APIResourceConfig[] {
  return API_RESOURCES.filter((r) => r.enabled);
}

/**
 * Enum names that should be exposed in the API types
 * These enums will be included in the generated api.ts file
 */
export const EXPOSED_ENUMS = [
  'currency_code',
  'payment_method_code',
  'provider_code',
  'provider_payment_status',
  'transaction_status',
  'transaction_type',
  'refund_status',
  'payout_status',
  'subscription_status',
  'product_type',
  'pricing_model',
  'usage_frequency',
  'checkout_session_status',
  'invoice_status',
  'webhook_event',
  'spi_payment_status',
  'spi_account_status',
  'spi_account_type',
  'spi_payment_category',
  'spi_payment_flow_type',
  'spi_payment_request_category',
  'spi_document_type',
  'spi_rejection_reason',
  'spi_webhook_event_code',
  'organization_status',
  'organization_verification_status',
  'pricing_plan_type',
  'fee_category',
  'fee_subcategory',
  'billing_interval',
  'customer_type',
  'discount_type',
  'qr_code_type',
  'link_type',
  'failed_payment_action',
  'first_payment_type',
  'usage_aggregation',
  'bnpl_status',
  'integration_source',
];

/**
 * Check if an enum should be exposed
 */
export function isEnumExposed(enumName: string): boolean {
  return EXPOSED_ENUMS.includes(enumName);
}

/**
 * RPC function names that should be exposed in the API types
 * These functions will be included in the generated api.ts file
 */
export const EXPOSED_FUNCTIONS = [
  // Accounts
  'fetch_balance_breakdown',
  'fetch_account_balance',
  'list_accounts',
  'get_account',
  'check_merchant_available_balance',
  // Auth & logging
  'verify_api_key',
  'log_api_interaction',
  // Organizations
  'list_organizations',
  'fetch_organization_details',
  // Customers
  'fetch_customers_with_status',
  'create_customer',
  'update_customer',
  'delete_customer',
  'fetch_customer_transactions',
  'create_or_update_customer',
  'create_customer_portal_launch_session',
  'merchant_list_customer_portal_audit_events',
  // Checkout sessions
  'create_checkout_session',
  'create_checkout_session_with_line_items',
  'list_checkout_sessions',
  'get_checkout_session_api',
  // Invoices
  'create_invoice_receivable',
  'list_customer_invoices_api',
  'get_customer_invoice_api',
  'update_customer_invoice_api',
  'create_invoice_checkout_session',
  'mark_invoice_paid_from_transaction',
  'get_blocking_customer_obligations',
  // Payment links
  'create_payment_link',
  'list_payment_links',
  'get_payment_link_api',
  // Payment requests
  'create_payment_request_api',
  'list_payment_requests',
  'get_payment_request_api',
  // Payment intents (Stripe)
  'prepare_stripe_payment_amount',
  'create_stripe_transaction',
  // Products & pricing
  'fetch_products',
  'create_product',
  'create_price',
  'set_default_price',
  'get_product_api',
  'get_product_prices_api',
  'get_product_fees_api',
  // Discount coupons
  'create_discount_coupon',
  'get_coupon_details_for_management',
  'get_organization_coupons',
  'get_coupon_performance',
  // Subscriptions
  'fetch_subscriptions',
  'fetch_subscriptions_for_customer',
  'get_customer_subscription',
  'cancel_customer_subscription',
  // Transactions
  'fetch_transactions',
  'get_transaction',
  // Beneficiary payouts
  'create_beneficiary_payout',
  'fetch_beneficiary_payouts',
  'get_beneficiary_payout_api',
  // Payouts (Wave provider)
  'fetch_wave_provider_settings',
  // Webhooks (merchant config)
  'get_webhook',
  'get_webhook_by_id',
  'update_webhook',
  'fetch_organization_webhooks',
  'get_merchant_from_organization',
  'get_webhook_delivery_logs',
  'get_webhook_delivery_log',
  'fetch_payouts',
  'create_mtn_transaction',
  'update_mtn_provider_reference',
  'initiate_spi_payout',
  'update_spi_payout_status',
  'initiate_withdrawal_api',
  'get_payout_api',
  'fetch_payout_method_details',
  'get_beneficiary_payout_api',
  'fetch_beneficiary_payouts',
  'create_beneficiary_payout',
  'get_transaction_by_stripe_intent',
  'fetch_organization_providers_settings_api',
  'create_manual_refund_request_api',
  'create_stripe_card_refund',
  'create_stripe_card_refund_api',
  'complete_stripe_deferred_subscription_setup',
  'transaction_has_pending_dispute',
  'apply_stripe_dispute_lost_effects',
  'create_wave_refund_request_api',
  'rollback_wave_refund',
  'apply_wave_partial_refund_charges',
  'create_refund',
  'update_organization_balance_for_refund',
  'list_refunds',
  'get_refund',
  'get_effective_other_fee_config',
  'get_customer',
  'log_webhook_delivery',
  // Webhooks (dispatch / outbox)
  'webhook_outbox_upsert_event',
  'webhook_dispatch_ensure',
  'webhook_dispatch_should_process',
  'record_webhook_delivery_attempt',
  'mark_webhook_dispatch_delivered',
  'mark_webhook_dispatch_dead_letter',
  'claim_inbound_provider_webhook_event',
  // Wave webhook handlers
  'get_wave_transaction_by_checkout_id',
  'get_checkout_session_by_wave_id',
  'recover_missing_wave_transaction',
  'find_wave_transaction_by_provider_txn_id',
  'update_transaction_status',
  'update_balances_for_transaction',
  // Stripe webhook handlers
  'update_stripe_checkout_status',
  'update_transaction_fee_metadata',
  'handle_stripe_dispute_created',
  'handle_stripe_dispute_updated',
  'handle_stripe_refund',
];

/**
 * Check if a function should be exposed
 */
export function isFunctionExposed(functionName: string): boolean {
  return EXPOSED_FUNCTIONS.includes(functionName);
}
