import { randomUUID } from 'node:crypto';
import { callScalar, type Db } from './client';
import { type Environment } from './seed';

export type WebhookEventName =
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_UPDATED';

export interface OrganizationWebhookOptions {
  url?: string;
  events?: WebhookEventName[];
  verificationToken?: string;
  environment?: Environment;
  isActive?: boolean;
}

/** Insert an organization webhook row for outbox / delivery RPC tests. */
export async function createOrganizationWebhook(
  client: Db,
  organizationId: string,
  merchantId: string,
  options: OrganizationWebhookOptions = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.webhooks
       (created_by, organization_id, url, authorized_events, verification_token,
        environment, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING webhook_id`,
    [
      merchantId,
      organizationId,
      options.url ?? `https://example.test/webhook/${suffix}`,
      options.events ?? ['PAYMENT_SUCCEEDED'],
      options.verificationToken ??
        `whsec_${suffix}${randomUUID().replace(/-/g, '')}`,
      options.environment ?? 'live',
      options.isActive ?? true,
    ],
  );
  return res.rows[0].webhook_id as string;
}

/**
 * Checkout / provider-connection seed helpers for DB integration suites.
 * All inserts run inside the caller's rolled-back transaction.
 */

export type ProviderCode =
  | 'WAVE'
  | 'MTN'
  | 'STRIPE'
  | 'GIM'
  | 'SPI'
  | 'FREE';

export interface ConnectProviderOptions {
  isConnected?: boolean;
  phoneNumber?: string;
  providerMerchantId?: string;
  metadata?: Record<string, unknown>;
}

/** Connect SPI with default spi account metadata for integration suites. */
export async function connectSpi(
  client: Db,
  organizationId: string,
  options: ConnectProviderOptions = {},
): Promise<void> {
  const suffix = randomUUID().slice(0, 8);
  await connectProvider(client, organizationId, 'SPI', {
    ...options,
    metadata: {
      spi_account_number: `SN08SPI${suffix.replace(/\D/g, '0').slice(0, 8).padEnd(8, '0')}`,
      ...options.metadata,
    },
  });
}

export async function connectProvider(
  client: Db,
  organizationId: string,
  provider: ProviderCode,
  options: ConnectProviderOptions = {},
): Promise<void> {
  const suffix = randomUUID().slice(0, 8);
  await client.query(
    `INSERT INTO public.organization_providers_settings
       (organization_id, provider_code, is_connected, phone_number,
        provider_merchant_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (organization_id, provider_code)
       DO UPDATE SET
         is_connected = EXCLUDED.is_connected,
         phone_number = EXCLUDED.phone_number,
         provider_merchant_id = EXCLUDED.provider_merchant_id,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
    [
      organizationId,
      provider,
      options.isConnected ?? true,
      options.phoneNumber ?? `+22177${suffix.replace(/\D/g, '0').slice(0, 7).padEnd(7, '0')}`,
      options.providerMerchantId ?? `prov_${suffix}`,
      options.metadata ? JSON.stringify(options.metadata) : null,
    ],
  );
}

export interface CheckoutSessionOptions {
  amount?: number;
  currency?: 'XOF' | 'USD' | 'EUR';
  environment?: Environment;
  customerId?: string | null;
  status?: 'open' | 'completed' | 'expired';
  expiresInMinutes?: number;
}

export interface CheckoutSessionRpcOptions {
  amount?: number;
  currency?: 'XOF' | 'USD' | 'EUR';
  environment?: Environment;
  customerId?: string | null;
}

/** Call `public.create_checkout_session` with the minimal required RPC args. */
export async function createCheckoutSessionRpc(
  client: Db,
  organizationId: string,
  merchantId: string,
  options: CheckoutSessionRpcOptions = {},
): Promise<Record<string, unknown>> {
  return callScalar<Record<string, unknown>>(
    client,
    'public.create_checkout_session',
    {
      p_organization_id: organizationId,
      p_amount: options.amount ?? 5000,
      p_currency_code: options.currency ?? 'XOF',
      p_environment: options.environment ?? 'live',
      p_created_by: merchantId,
      p_customer_id: options.customerId ?? null,
    },
  );
}

export interface OrganizationWebhookOptions {
  url?: string;
  environment?: Environment;
  verificationToken?: string;
}

/** Insert an active org webhook subscribed to PAYMENT_SUCCEEDED. */
export async function createOrganizationWebhook(
  client: Db,
  organizationId: string,
  merchantId: string,
  options: OrganizationWebhookOptions = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.webhooks
       (organization_id, url, authorized_events, is_active,
        verification_token, environment, created_by)
     VALUES ($1, $2, $3, true, $4, $5, $6)
     RETURNING webhook_id`,
    [
      organizationId,
      options.url ?? `https://example.test/hooks/${suffix}`,
      ['PAYMENT_SUCCEEDED'],
      options.verificationToken ?? `vt_${suffix}`,
      options.environment ?? 'live',
      merchantId,
    ],
  );
  return res.rows[0].webhook_id as string;
}

export async function createCheckoutSession(
  client: Db,
  organizationId: string,
  options: CheckoutSessionOptions = {},
): Promise<string> {
  const amount = options.amount ?? 5000;
  const expiresAt = new Date(
    Date.now() + (options.expiresInMinutes ?? 60) * 60_000,
  ).toISOString();
  const res = await client.query(
    `INSERT INTO public.checkout_sessions
       (organization_id, amount, currency_code, expires_at, environment,
        customer_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING checkout_session_id`,
    [
      organizationId,
      amount,
      options.currency ?? 'XOF',
      expiresAt,
      options.environment ?? 'live',
      options.customerId ?? null,
      options.status ?? 'open',
    ],
  );
  return res.rows[0].checkout_session_id as string;
}

export interface PayoutMethodOptions {
  provider?: ProviderCode;
  accountNumber?: string;
  accountName?: string;
  isDefault?: boolean;
}

export async function createPayoutMethod(
  client: Db,
  organizationId: string,
  options: PayoutMethodOptions = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const provider = options.provider ?? 'WAVE';
  const res = await client.query(
    `INSERT INTO public.payout_methods
       (organization_id, account_number, account_name, bank_name,
        payout_method_type, auto_withdrawal_mobile_provider, provider_code,
        is_valid, verification_status, is_default)
     VALUES ($1, $2, $3, $4, 'mobile_money', $5, $5, true, 'verified', $6)
     RETURNING payout_method_id`,
    [
      organizationId,
      options.accountNumber ?? `+22177${suffix.slice(0, 7)}`,
      options.accountName ?? 'Test Recipient',
      provider,
      options.isDefault ?? false,
    ],
  );
  return res.rows[0].payout_method_id as string;
}

export async function getProviderTransaction(
  client: Db,
  transactionId: string,
): Promise<Record<string, unknown> | undefined> {
  const res = await client.query(
    `SELECT * FROM public.providers_transactions WHERE transaction_id = $1`,
    [transactionId],
  );
  return res.rows[0];
}

export async function getCheckoutSession(
  client: Db,
  checkoutSessionId: string,
): Promise<Record<string, unknown> | undefined> {
  const res = await client.query(
    `SELECT * FROM public.checkout_sessions WHERE checkout_session_id = $1`,
    [checkoutSessionId],
  );
  return res.rows[0];
}

export async function platformFeeBalance(
  client: Db,
  currency: 'XOF' | 'USD' | 'EUR' = 'XOF',
): Promise<number> {
  const res = await client.query(
    `SELECT COALESCE(available_balance, 0) AS balance
       FROM public.platform_main_account
      WHERE currency_code = $1`,
    [currency],
  );
  if (!res.rows.length) return 0;
  return Number(res.rows[0].balance);
}

/** Wave/MTN refund status promotion updates providers_transactions when present. */
export async function ensureProviderTransaction(
  client: Db,
  transactionId: string,
  organizationId: string,
  provider: ProviderCode,
  status: 'processing' | 'succeeded' = 'succeeded',
  options: { providerCheckoutId?: string } = {},
): Promise<void> {
  await client.query(
    `INSERT INTO public.providers_transactions
       (transaction_id, organization_id, provider_code, provider_payment_status,
        provider_checkout_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (transaction_id) DO UPDATE
       SET provider_payment_status = EXCLUDED.provider_payment_status,
           provider_checkout_id = COALESCE(
             EXCLUDED.provider_checkout_id,
             providers_transactions.provider_checkout_id
           ),
           updated_at = NOW()`,
    [
      transactionId,
      organizationId,
      provider,
      status,
      options.providerCheckoutId ?? `prov_${randomUUID().slice(0, 12)}`,
    ],
  );
}
