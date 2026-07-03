import { randomUUID } from 'node:crypto';
import { type Db } from './client';

/**
 * Minimal, dependency-ordered seed helpers for the DB integration suite.
 * Everything is inserted inside the caller's rolled-back transaction, so the
 * data never persists. Helpers insert only the columns required to satisfy
 * NOT NULL / FK / CHECK constraints and rely on table defaults for the rest.
 */

export type Environment = 'test' | 'live';

/**
 * Ensure the reference rows the FK graph depends on exist. These are normally
 * seeded by migrations on the test instance already; ON CONFLICT DO NOTHING
 * makes this safe and idempotent either way.
 */
export async function ensureReferenceData(client: Db): Promise<void> {
  await client.query(`
    INSERT INTO public.currencies (code, name) VALUES
      ('XOF', 'West African CFA franc'),
      ('USD', 'US Dollar'),
      ('EUR', 'Euro')
    ON CONFLICT (code) DO NOTHING;
  `);
  await client.query(`
    INSERT INTO public.providers (name, code, description) VALUES
      ('WAVE', 'WAVE', 'Wave mobile money'),
      ('STRIPE', 'STRIPE', 'Stripe cards'),
      ('MTN', 'MTN', 'MTN mobile money'),
      ('SPI', 'SPI', 'SPI bank transfer'),
      ('GIM', 'GIM', 'GIM cards'),
      ('FREE', 'FREE', 'Free / zero-amount')
    ON CONFLICT (name) DO NOTHING;
  `);
  await client.query(`
    INSERT INTO public.payment_methods (payment_method_code, provider_code) VALUES
      ('MOBILE_MONEY', 'WAVE'),
      ('MOBILE_MONEY', 'MTN'),
      ('CARDS', 'STRIPE'),
      ('CARDS', 'GIM'),
      ('BANK_TRANSFER', 'SPI'),
      ('FREE', 'FREE')
    ON CONFLICT (payment_method_code, provider_code) DO NOTHING;
  `);
}

export interface OrgOptions {
  name?: string;
  pricingPlan?: 'fixed' | 'volume_tiered' | 'custom';
  defaultCurrency?: 'XOF' | 'USD' | 'EUR';
}

export async function createOrganization(
  client: Db,
  options: OrgOptions = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.organizations
       (name, email, phone_number, default_currency, pricing_plan_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING organization_id`,
    [
      options.name ?? `Test Org ${suffix}`,
      `org-${suffix}@example.test`,
      `+221700${suffix.replace(/\D/g, '0').slice(0, 6).padEnd(6, '0')}`,
      options.defaultCurrency ?? 'XOF',
      options.pricingPlan ?? 'fixed',
    ],
  );
  return res.rows[0].organization_id as string;
}

export async function createMerchant(
  client: Db,
  options: { email?: string; name?: string } = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.merchants (name, email)
     VALUES ($1, $2)
     RETURNING merchant_id`,
    [options.name ?? `Merchant ${suffix}`, options.email ?? `m-${suffix}@example.test`],
  );
  return res.rows[0].merchant_id as string;
}

export async function linkMerchant(
  client: Db,
  merchantId: string,
  organizationId: string,
  role: 'Admin' | 'Member' = 'Admin',
): Promise<string> {
  const res = await client.query(
    `INSERT INTO public.merchant_organization_links
       (merchant_id, organization_id, role, team_status)
     VALUES ($1, $2, $3, 'active')
     RETURNING merchant_org_id`,
    [merchantId, organizationId, role],
  );
  return res.rows[0].merchant_org_id as string;
}

/**
 * Create an org with an Admin merchant already linked - the common baseline
 * for most RPCs (they resolve the admin merchant from the org link).
 */
export async function createOrgWithAdmin(
  client: Db,
  options: OrgOptions = {},
): Promise<{ organizationId: string; merchantId: string }> {
  const organizationId = await createOrganization(client, options);
  const merchantId = await createMerchant(client);
  await linkMerchant(client, merchantId, organizationId, 'Admin');
  return { organizationId, merchantId };
}

export async function createCustomer(
  client: Db,
  organizationId: string,
  options: { environment?: Environment; email?: string; name?: string } = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.customers (organization_id, name, email, environment)
     VALUES ($1, $2, $3, $4)
     RETURNING customer_id`,
    [
      organizationId,
      options.name ?? `Customer ${suffix}`,
      options.email ?? `c-${suffix}@example.test`,
      options.environment ?? 'test',
    ],
  );
  return res.rows[0].customer_id as string;
}

export interface ProductOptions {
  type?: 'one_time' | 'recurring' | 'usage_based';
  environment?: Environment;
  name?: string;
  failedPaymentAction?: 'cancel' | 'pause' | 'continue';
  firstPaymentType?: 'initial' | 'non_initial' | 'prorated';
  chargeDay?: number | null;
  trialEnabled?: boolean;
  trialPeriodDays?: number | null;
  metadata?: Record<string, unknown> | null;
}

export async function createProduct(
  client: Db,
  organizationId: string,
  options: ProductOptions = {},
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const res = await client.query(
    `INSERT INTO public.products
       (organization_id, name, product_type, environment,
        failed_payment_action, first_payment_type, charge_day,
        trial_enabled, trial_period_days, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING product_id`,
    [
      organizationId,
      options.name ?? `Product ${suffix}`,
      options.type ?? 'one_time',
      options.environment ?? 'test',
      options.failedPaymentAction ?? null,
      options.firstPaymentType ?? 'initial',
      options.chargeDay ?? null,
      options.trialEnabled ?? false,
      options.trialPeriodDays ?? null,
      options.metadata ? JSON.stringify(options.metadata) : null,
    ],
  );
  return res.rows[0].product_id as string;
}

export interface PriceOptions {
  amount?: number;
  currency?: 'XOF' | 'USD' | 'EUR';
  billingInterval?:
    | 'day'
    | 'week'
    | 'bi-weekly'
    | 'month'
    | 'bi-monthly'
    | 'quarterly'
    | 'semi-annual'
    | 'year'
    | 'lifetime'
    | 'unit'
    | null;
  environment?: Environment;
  isDefault?: boolean;
  isActive?: boolean;
  pricingModel?: 'standard' | 'pay_what_you_want' | 'tiered' | 'volume';
}

export async function createPrice(
  client: Db,
  productId: string,
  organizationId: string,
  options: PriceOptions = {},
): Promise<string> {
  const res = await client.query(
    `INSERT INTO public.prices
       (product_id, organization_id, amount, currency_code, billing_interval,
        pricing_model, is_active, is_default, environment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING price_id`,
    [
      productId,
      organizationId,
      options.amount ?? 5000,
      options.currency ?? 'XOF',
      options.billingInterval ?? null,
      options.pricingModel ?? 'standard',
      options.isActive ?? true,
      options.isDefault ?? true,
      options.environment ?? 'test',
    ],
  );
  return res.rows[0].price_id as string;
}

export async function ensureAccount(
  client: Db,
  organizationId: string,
  options: { currency?: 'XOF' | 'USD' | 'EUR'; balance?: number } = {},
): Promise<string> {
  const res = await client.query(
    `INSERT INTO public.accounts (organization_id, currency_code, balance)
     VALUES ($1, $2, $3)
     ON CONFLICT (organization_id, currency_code)
       DO UPDATE SET balance = EXCLUDED.balance
     RETURNING account_id`,
    [organizationId, options.currency ?? 'XOF', options.balance ?? 0],
  );
  return res.rows[0].account_id as string;
}

export interface SubscriptionOptions {
  status?:
    | 'pending'
    | 'active'
    | 'paused'
    | 'cancelled'
    | 'expired'
    | 'past_due'
    | 'trial';
  environment?: Environment;
  startDate?: string; // YYYY-MM-DD
  endDate?: string | null;
  nextBillingDate?: string | null;
  providerPaymentMethodId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  priceId?: string | null;
}

export async function createSubscription(
  client: Db,
  organizationId: string,
  productId: string,
  customerId: string,
  options: SubscriptionOptions = {},
): Promise<string> {
  const res = await client.query(
    `INSERT INTO public.subscriptions
       (organization_id, product_id, price_id, customer_id,
        provider_payment_method_id, status, start_date, end_date,
        next_billing_date, environment, created_by, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING subscription_id`,
    [
      organizationId,
      productId,
      options.priceId ?? null,
      customerId,
      options.providerPaymentMethodId ?? null,
      options.status ?? 'pending',
      options.startDate ?? new Date().toISOString().slice(0, 10),
      options.endDate ?? null,
      options.nextBillingDate ?? null,
      options.environment ?? 'test',
      options.createdBy ?? null,
      options.metadata ? JSON.stringify(options.metadata) : null,
    ],
  );
  return res.rows[0].subscription_id as string;
}

export interface MeterOptions {
  name?: string;
  productId?: string | null;
  filter?: Record<string, unknown>;
  aggregation?: Record<string, unknown>;
  isActive?: boolean;
}

export async function createMeter(
  client: Db,
  organizationId: string,
  options: MeterOptions = {},
): Promise<{ meterId: string; code: string }> {
  const suffix = randomUUID().slice(0, 8);
  const name = (options.name ?? `api_calls_${suffix}`).toLowerCase();
  const res = await client.query(
    `INSERT INTO public.meters
       (organization_id, product_id, name, filter, aggregation, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING meter_id`,
    [
      organizationId,
      options.productId ?? null,
      name,
      JSON.stringify(options.filter ?? { code: name }),
      JSON.stringify(
        options.aggregation ?? { type: 'sum', property: 'quantity' },
      ),
      options.isActive ?? true,
    ],
  );
  return { meterId: res.rows[0].meter_id as string, code: name };
}

/**
 * Read helper: fetch a single transaction row by id (bypasses RLS via postgres).
 */
export async function getTransaction(
  client: Db,
  transactionId: string,
): Promise<Record<string, unknown> | undefined> {
  const res = await client.query(
    `SELECT * FROM public.transactions WHERE transaction_id = $1`,
    [transactionId],
  );
  return res.rows[0];
}

export async function getSubscription(
  client: Db,
  subscriptionId: string,
): Promise<Record<string, unknown> | undefined> {
  const res = await client.query(
    `SELECT * FROM public.subscriptions WHERE subscription_id = $1`,
    [subscriptionId],
  );
  return res.rows[0];
}

export async function getEvent(
  client: Db,
  eventId: string,
): Promise<Record<string, unknown> | undefined> {
  const res = await client.query(
    `SELECT * FROM public.events WHERE event_id = $1`,
    [eventId],
  );
  return res.rows[0];
}
