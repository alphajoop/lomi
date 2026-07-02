import { newIdempotencyKey } from '../client';
import { pickString, unwrapData } from '../assert';
import type { CheckDefinition, SuiteContext } from '../types';

function synthEmail(ctx: SuiteContext): string {
  return `synthetics+${ctx.runId}@lomi.test`;
}

function synthCode(ctx: SuiteContext, prefix: string): string {
  return `${prefix}${ctx.runId.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

function futureExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

export function createSandboxChecks(): CheckDefinition[] {
  return [
    // --- Identity / infra ---
    {
      name: 'health liveness',
      service: 'health',
      method: 'GET',
      path: '/health',
      auth: false,
      expectStatus: 200,
      validate: (_ctx, res) => {
        const body = res.data as Record<string, unknown>;
        return body?.ok === true ? null : 'Expected ok: true in /health';
      },
    },
    {
      name: 'health readiness',
      service: 'health',
      method: 'GET',
      path: '/ready',
      auth: false,
      expectStatus: [200, 503],
      validate: (_ctx, res) => {
        if (res.status === 503) {
          return 'Readiness check returned 503 (dependencies unhealthy)';
        }
        return null;
      },
    },
    {
      name: 'me identity',
      service: 'identity',
      method: 'GET',
      path: '/me',
      expectStatus: 200,
      validate: (_ctx, res) => {
        const env = pickString(res.data, 'environment');
        if (env !== 'test') {
          return `Expected environment "test", got "${env ?? 'missing'}"`;
        }
        return null;
      },
    },
    {
      name: 'list providers',
      service: 'providers',
      method: 'GET',
      path: '/providers',
      expectStatus: 200,
    },

    // --- Customers ---
    {
      name: 'create customer',
      service: 'customers',
      method: 'POST',
      path: '/customers',
      body: (ctx) => ({
        name: `Synthetics ${ctx.runId}`,
        email: synthEmail(ctx),
        phone_number: '+2250707070707',
        metadata: { source: 'api_synthetics' },
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        ctx.customerId =
          pickString(res.data, 'customer_id', 'id') ?? ctx.customerId;
      },
    },
    {
      name: 'get customer',
      service: 'customers',
      method: 'GET',
      path: (ctx) => `/customers/${ctx.customerId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.customerId ? null : 'customerId not captured from create',
    },

    // --- Products ---
    {
      name: 'create product',
      service: 'products',
      method: 'POST',
      path: '/products',
      body: (ctx) => ({
        name: `Synth product ${ctx.runId}`,
        product_type: 'one_time',
        prices: [{ amount: 1000, currency_code: 'XOF' }],
        metadata: { source: 'api_synthetics' },
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        ctx.productId =
          pickString(res.data, 'product_id', 'id') ?? ctx.productId;
      },
    },
    {
      name: 'get product',
      service: 'products',
      method: 'GET',
      path: (ctx) => `/products/${ctx.productId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.productId ? null : 'productId not captured from create',
    },

    // --- Charges: Wave ---
    {
      name: 'charge wave pending scenario',
      service: 'charges',
      method: 'POST',
      path: '/charge/wave',
      headers: () => ({
        'X-Scenario-Key': 'pending',
        'Idempotency-Key': newIdempotencyKey(),
      }),
      body: () => ({
        amount: 1000,
        currency: 'XOF',
        customer: {
          name: 'Synth Wave',
          email: 'wave@lomi.test',
          phoneNumber: '+2250707070707',
        },
        description: 'API synthetics wave pending',
      }),
      expectStatus: [200, 201],
      validate: (_ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        const status = String(data?.status ?? data?.transaction_status ?? '');
        const url =
          pickString(res.data, 'wave_launch_url', 'checkout_url') ??
          pickString(data, 'wave_launch_url', 'checkout_url');
        const next = data?.next_action as Record<string, unknown> | undefined;
        const redirect =
          next?.type === 'redirect' && typeof next.url === 'string';
        if (status.toUpperCase() !== 'PENDING' && !url && !redirect) {
          return 'Expected PENDING wave charge with redirect URL';
        }
        return null;
      },
    },
    {
      name: 'charge mtn auto-complete',
      service: 'charges',
      method: 'POST',
      path: '/charge/mtn',
      headers: () => ({ 'Idempotency-Key': newIdempotencyKey() }),
      body: () => ({
        amount: 1000,
        currency: 'XOF',
        customer: {
          name: 'Synth MTN',
          email: 'mtn@lomi.test',
          phoneNumber: '+2250707070707',
        },
        description: 'API synthetics mtn',
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        ctx.transactionId =
          pickString(res.data, 'transaction_id', 'id') ?? ctx.transactionId;
      },
      validate: (_ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        const status = String(data?.status ?? data?.transaction_status ?? '');
        if (status && status.toLowerCase() !== 'completed') {
          return `Expected completed MTN charge in sandbox, got "${status}"`;
        }
        return null;
      },
    },
    {
      name: 'charge mtn failed scenario',
      service: 'charges',
      method: 'POST',
      path: '/charge/mtn',
      headers: () => ({
        'X-Scenario-Key': 'failed',
        'Idempotency-Key': newIdempotencyKey(),
      }),
      body: () => ({
        amount: 1000,
        currency: 'XOF',
        customer: {
          name: 'Synth MTN Fail',
          phoneNumber: '+2250707070707',
        },
      }),
      expectStatus: 400,
    },
    {
      name: 'charge switch approved scenario',
      service: 'charges',
      method: 'POST',
      path: '/charge/switch',
      headers: () => ({
        'X-Scenario-Key': 'approved',
        'Idempotency-Key': newIdempotencyKey(),
      }),
      body: (ctx) => ({
        amount: 1000,
        currency_code: 'XOF',
        pan: '4221941234569109',
        expiry: '06/30',
        cvv: '123',
        customer_email: synthEmail(ctx),
        customer_name: 'Synth Switch',
      }),
      expectStatus: [200, 201],
      validate: (_ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        const inner = (data?.data ?? data) as Record<string, unknown>;
        const status = String(inner?.status ?? '');
        if (status && status !== 'approved') {
          return `Expected approved switch scenario, got "${status}"`;
        }
        return null;
      },
    },
    {
      name: 'charge card embedded',
      service: 'charges',
      method: 'POST',
      path: '/charge/card',
      headers: () => ({ 'Idempotency-Key': newIdempotencyKey() }),
      body: (ctx) => ({
        amount: 1000,
        currency_code: 'XOF',
        customer_email: synthEmail(ctx),
        customer_name: 'Synth Card',
      }),
      expectStatus: [200, 201],
      validate: (_ctx, res) => {
        const secret = pickString(res.data, 'client_secret');
        if (!secret) {
          return 'Expected client_secret in card charge response';
        }
        return null;
      },
    },

    // --- Refunds ---
    {
      name: 'create refund',
      service: 'refunds',
      method: 'POST',
      path: '/refunds',
      headers: () => ({ 'Idempotency-Key': newIdempotencyKey() }),
      body: (ctx) => ({
        transaction_id: ctx.transactionId,
        amount: 100,
        reason: 'API synthetics partial refund',
      }),
      expectStatus: [200, 201],
      skipIf: (ctx) =>
        ctx.transactionId
          ? null
          : 'transactionId not captured from MTN charge',
      capture: (ctx, res) => {
        ctx.refundId =
          pickString(res.data, 'refund_id', 'id') ?? ctx.refundId;
      },
    },
    {
      name: 'get refund',
      service: 'refunds',
      method: 'GET',
      path: (ctx) => `/refunds/${ctx.refundId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.refundId ? null : 'refundId not captured from create',
    },

    // --- Checkout / links / requests ---
    {
      name: 'create checkout session',
      service: 'checkout-sessions',
      method: 'POST',
      path: '/checkout-sessions',
      headers: () => ({ 'Idempotency-Key': newIdempotencyKey() }),
      body: () => ({
        currency_code: 'XOF',
        amount: 1000,
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        title: 'API synthetics checkout',
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        ctx.checkoutSessionId =
          pickString(res.data, 'checkout_session_id', 'id') ??
          ctx.checkoutSessionId;
      },
    },
    {
      name: 'get checkout session',
      service: 'checkout-sessions',
      method: 'GET',
      path: (ctx) => `/checkout-sessions/${ctx.checkoutSessionId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.checkoutSessionId
          ? null
          : 'checkoutSessionId not captured from create',
    },
    {
      name: 'create payment link',
      service: 'payment-links',
      method: 'POST',
      path: '/payment-links',
      body: () => ({
        link_type: 'instant',
        title: 'API synthetics link',
        currency_code: 'XOF',
        amount: 1000,
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        ctx.paymentLinkId =
          pickString(res.data, 'link_id', 'payment_link_id', 'id') ??
          ctx.paymentLinkId;
      },
    },
    {
      name: 'get payment link',
      service: 'payment-links',
      method: 'GET',
      path: (ctx) => `/payment-links/${ctx.paymentLinkId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.paymentLinkId ? null : 'paymentLinkId not captured',
    },
    {
      name: 'create payment request',
      service: 'payment-requests',
      method: 'POST',
      path: '/payment-requests',
      headers: () => ({ 'Idempotency-Key': newIdempotencyKey() }),
      body: (ctx) => ({
        amount: 1000,
        currency_code: 'XOF',
        description: 'API synthetics request',
        expiry_date: futureExpiry(),
        customer_id: ctx.customerId,
      }),
      expectStatus: [200, 201],
      skipIf: (ctx) =>
        ctx.customerId ? null : 'customerId required for payment request',
      capture: (ctx, res) => {
        ctx.paymentRequestId =
          pickString(res.data, 'request_id', 'payment_request_id', 'id') ??
          ctx.paymentRequestId;
      },
    },
    {
      name: 'get payment request',
      service: 'payment-requests',
      method: 'GET',
      path: (ctx) => `/payment-requests/${ctx.paymentRequestId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.paymentRequestId ? null : 'paymentRequestId not captured',
    },

    // --- Transactions / subscriptions ---
    {
      name: 'list transactions',
      service: 'transactions',
      method: 'GET',
      path: '/transactions?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'get transaction',
      service: 'transactions',
      method: 'GET',
      path: (ctx) => `/transactions/${ctx.transactionId}`,
      expectStatus: 200,
      skipIf: (ctx) =>
        ctx.transactionId ? null : 'transactionId not captured',
    },
    {
      name: 'list subscriptions',
      service: 'subscriptions',
      method: 'GET',
      path: '/subscriptions?pageSize=1',
      expectStatus: 200,
    },

    // --- Coupons ---
    {
      name: 'create discount coupon',
      service: 'discount-coupons',
      method: 'POST',
      path: '/discount-coupons',
      body: (ctx) => ({
        code: synthCode(ctx, 'SYN'),
        discount_type: 'percentage',
        discount_percentage: 10,
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        ctx.couponId =
          pickString(res.data, 'coupon_id', 'id') ?? ctx.couponId;
      },
    },
    {
      name: 'get discount coupon',
      service: 'discount-coupons',
      method: 'GET',
      path: (ctx) => `/discount-coupons/${ctx.couponId}`,
      expectStatus: 200,
      skipIf: (ctx) => (ctx.couponId ? null : 'couponId not captured'),
    },

    // --- Metering ---
    {
      name: 'create meter',
      service: 'metering',
      method: 'POST',
      path: '/meters',
      body: (ctx) => ({
        name: `synth_${ctx.runId.replace(/-/g, '').slice(0, 12)}`,
        aggregation: { type: 'sum', property: 'quantity' },
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        const name = pickString(res.data, 'name', 'meter_code');
        if (name) ctx.meterName = name;
      },
    },
    {
      name: 'list meters',
      service: 'metering',
      method: 'GET',
      path: '/meters',
      expectStatus: 200,
    },
    {
      name: 'ingest usage event',
      service: 'metering',
      method: 'POST',
      path: '/usage-events',
      body: (ctx) => ({
        transaction_id: `synth_evt_${ctx.runId}`,
        code: ctx.meterName,
        customer_id: ctx.customerId,
        quantity: 1,
      }),
      expectStatus: [200, 201, 202],
      skipIf: (ctx) => {
        if (!ctx.meterName) return 'meterName not captured';
        if (!ctx.customerId) return 'customerId required for usage event';
        return null;
      },
    },

    // --- Webhooks ---
    {
      name: 'create webhook',
      service: 'webhooks',
      method: 'POST',
      path: '/webhooks',
      body: (ctx) => ({
        url: `https://example.com/webhooks/synthetics-${ctx.runId}`,
        authorized_events: ['PAYMENT_SUCCEEDED'],
        description: 'API synthetics webhook',
      }),
      expectStatus: [200, 201],
      capture: (ctx, res) => {
        const data = unwrapData(res.data) as Record<string, unknown>;
        const id =
          (typeof data?.id === 'string' ? data.id : undefined) ??
          pickString(res.data, 'webhook_id', 'id');
        if (id) ctx.webhookId = id;
      },
    },
    {
      name: 'test webhook delivery',
      service: 'webhooks',
      method: 'POST',
      path: (ctx) => `/webhooks/${ctx.webhookId}/test`,
      expectStatus: [200, 201, 202],
      skipIf: (ctx) =>
        ctx.webhookId ? null : 'webhookId not captured from create',
    },
    {
      name: 'delete webhook cleanup',
      service: 'webhooks',
      method: 'DELETE',
      path: (ctx) => `/webhooks/${ctx.webhookId}`,
      expectStatus: [200, 204],
      skipIf: (ctx) =>
        ctx.webhookId ? null : 'webhookId not captured from create',
    },

    // --- Radar / logs / accounts ---
    {
      name: 'radar settings',
      service: 'radar',
      method: 'GET',
      path: '/organization/radar-settings',
      expectStatus: [200, 404],
    },
    {
      name: 'api request logs',
      service: 'logs',
      method: 'GET',
      path: '/logs?type=api_request&limit=1',
      expectStatus: 200,
    },
    {
      name: 'accounts balance',
      service: 'accounts',
      method: 'GET',
      path: '/accounts/balance',
      expectStatus: 200,
    },

    // --- Cleanup ---
    {
      name: 'delete customer cleanup',
      service: 'customers',
      method: 'DELETE',
      path: (ctx) => `/customers/${ctx.customerId}`,
      expectStatus: [200, 204],
      skipIf: (ctx) =>
        ctx.customerId ? null : 'customerId not captured from create',
    },
  ];
}