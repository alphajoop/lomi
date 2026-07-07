import { randomUUID } from 'node:crypto';
import {
  callScalar,
  dbDescribe,
  withRollback,
  type Db,
} from './support/client';
import {
  createCustomer,
  createOrgWithAdmin,
  createPrice,
  createProduct,
  ensureReferenceData,
  getEvent,
} from './support/seed';

/**
 * Usage metering pipeline: enqueue → process (idempotent), charge calculation,
 * and billing-period close.
 */

const METER_CODE = 'api_calls';

interface UsageCtx {
  organizationId: string;
  merchantId: string;
  customerId: string;
}

async function seedUsageCtx(client: Db): Promise<UsageCtx> {
  await ensureReferenceData(client);
  const { organizationId, merchantId } = await createOrgWithAdmin(client);
  const customerId = await createCustomer(client, organizationId, {
    environment: 'test',
  });
  return { organizationId, merchantId, customerId };
}

async function usageProduct(
  client: Db,
  organizationId: string,
  unitAmount = 100,
): Promise<{ productId: string; priceId: string }> {
  const productId = await createProduct(client, organizationId, {
    type: 'usage_based',
    environment: 'test',
    name: `usage_product_${randomUUID().slice(0, 6)}`,
  });
  const priceId = await createPrice(client, productId, organizationId, {
    amount: unitAmount,
    billingInterval: 'unit',
    pricingModel: 'standard',
    environment: 'test',
  });
  return { productId, priceId };
}

async function seedUsageSubscription(
  client: Db,
  ctx: UsageCtx,
  productId: string,
  priceId: string,
): Promise<string> {
  return callScalar<string>(client, 'public.create_usage_subscription', {
    p_merchant_id: ctx.merchantId,
    p_organization_id: ctx.organizationId,
    p_customer_id: ctx.customerId,
    p_product_id: productId,
    p_price_id: priceId,
    p_metadata: { source: 'harness' },
    p_environment: 'test',
  });
}

dbDescribe('Usage billing :: enqueue + process', () => {
  it('processes a usage event and records meter balance', async () => {
    await withRollback(async (client) => {
      const ctx = await seedUsageCtx(client);
      const { productId, priceId } = await usageProduct(
        client,
        ctx.organizationId,
      );
      const subscriptionId = await seedUsageSubscription(
        client,
        ctx,
        productId,
        priceId,
      );

      await callScalar<string>(client, 'public.create_meter', {
        p_organization_id: ctx.organizationId,
        p_product_id: productId,
        p_name: METER_CODE,
        p_filter: { code: METER_CODE },
        p_aggregation: { type: 'sum', property: 'quantity' },
      });

      const idempotencyKey = `usage_evt_${randomUUID().slice(0, 12)}`;
      const eventId = await callScalar<string>(
        client,
        'public.enqueue_usage_event',
        {
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_transaction_id: idempotencyKey,
          p_code: METER_CODE,
          p_subscription_id: subscriptionId,
          p_properties: { quantity: 5 },
          p_quantity: 5,
          p_environment: 'test',
          p_created_by: ctx.merchantId,
        },
      );
      expect(eventId).toBeTruthy();

      const first = await callScalar<Record<string, unknown>>(
        client,
        'public.process_usage_event',
        { p_event_id: eventId },
      );
      expect(first.status).toBe('processed');
      expect(first.idempotent).toBeFalsy();
      expect(first.meter_id).toBeTruthy();
      expect(Number(first.quantity_applied)).toBe(5);

      const event = await getEvent(client, eventId);
      expect(event?.processing_status).toBe('processed');

      const balance = await client.query(
        `SELECT balance FROM public.meter_balances
          WHERE customer_id = $1 AND meter_id = $2`,
        [ctx.customerId, first.meter_id],
      );
      expect(balance.rows.length).toBeGreaterThan(0);
      expect(Number(balance.rows[0].balance)).toBeGreaterThan(0);
    });
  });

  it('is idempotent when process_usage_event is called twice', async () => {
    await withRollback(async (client) => {
      const ctx = await seedUsageCtx(client);
      const { productId, priceId } = await usageProduct(
        client,
        ctx.organizationId,
      );
      const subscriptionId = await seedUsageSubscription(
        client,
        ctx,
        productId,
        priceId,
      );

      await callScalar<string>(client, 'public.create_meter', {
        p_organization_id: ctx.organizationId,
        p_product_id: productId,
        p_name: METER_CODE,
        p_filter: { code: METER_CODE },
        p_aggregation: { type: 'sum', property: 'quantity' },
      });

      const eventId = await callScalar<string>(
        client,
        'public.enqueue_usage_event',
        {
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_transaction_id: `usage_dup_${randomUUID().slice(0, 12)}`,
          p_code: METER_CODE,
          p_subscription_id: subscriptionId,
          p_quantity: 3,
          p_environment: 'test',
        },
      );

      await callScalar(client, 'public.process_usage_event', {
        p_event_id: eventId,
      });
      const second = await callScalar<Record<string, unknown>>(
        client,
        'public.process_usage_event',
        { p_event_id: eventId },
      );
      expect(second.status).toBe('processed');
      expect(second.idempotent).toBe(true);
    });
  });
});

dbDescribe('Usage billing :: calculate_usage_charge', () => {
  it('multiplies unit price by consumed units', async () => {
    await withRollback(async (client) => {
      const ctx = await seedUsageCtx(client);
      const { priceId } = await usageProduct(client, ctx.organizationId, 250);

      const charge = await callScalar<number>(
        client,
        'public.calculate_usage_charge',
        { p_price_id: priceId, p_units: 4 },
      );
      expect(Number(charge)).toBe(1000);
    });
  });
});

dbDescribe('Usage billing :: close_usage_billing_period', () => {
  it('closes an open billing period for a usage subscription', async () => {
    await withRollback(async (client) => {
      const ctx = await seedUsageCtx(client);
      const { productId, priceId } = await usageProduct(
        client,
        ctx.organizationId,
      );
      const subscriptionId = await seedUsageSubscription(
        client,
        ctx,
        productId,
        priceId,
      );

      await callScalar<string>(client, 'public.create_meter', {
        p_organization_id: ctx.organizationId,
        p_product_id: productId,
        p_name: METER_CODE,
        p_filter: { code: METER_CODE },
        p_aggregation: { type: 'count' },
      });

      const eventId = await callScalar<string>(
        client,
        'public.enqueue_usage_event',
        {
          p_organization_id: ctx.organizationId,
          p_customer_id: ctx.customerId,
          p_transaction_id: `usage_close_${randomUUID().slice(0, 12)}`,
          p_code: METER_CODE,
          p_subscription_id: subscriptionId,
          p_quantity: 2,
          p_environment: 'test',
        },
      );
      await callScalar(client, 'public.process_usage_event', {
        p_event_id: eventId,
      });

      const periodId = await callScalar<string>(
        client,
        'public.close_usage_billing_period',
        {
          p_subscription_id: subscriptionId,
          p_period_end: new Date().toISOString(),
        },
      );
      expect(periodId).toBeTruthy();

      const period = await client.query(
        `SELECT status FROM public.billing_periods WHERE billing_period_id = $1`,
        [periodId],
      );
      expect(['closed', 'invoiced']).toContain(period.rows[0]?.status);
    });
  });
});
