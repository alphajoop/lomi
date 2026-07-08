import { pickString, validateLogsListResponse } from '../assert';
import type { CheckDefinition } from '../types';

export function createLiveChecks(): CheckDefinition[] {
  return [
    {
      name: 'health liveness',
      service: 'health',
      method: 'GET',
      path: '/health',
      auth: false,
      expectStatus: 200,
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
        if (env !== 'live') {
          return `Expected environment "live", got "${env ?? 'missing'}"`;
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
    {
      name: 'accounts balance',
      service: 'accounts',
      method: 'GET',
      path: '/accounts/balance',
      expectStatus: 200,
    },
    {
      name: 'list transactions',
      service: 'transactions',
      method: 'GET',
      path: '/transactions?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'list customers',
      service: 'customers',
      method: 'GET',
      path: '/customers?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'list checkout sessions',
      service: 'checkout-sessions',
      method: 'GET',
      path: '/checkout-sessions?limit=1',
      expectStatus: 200,
    },
    {
      name: 'list payment links',
      service: 'payment-links',
      method: 'GET',
      path: '/payment-links?limit=1',
      expectStatus: 200,
    },
    {
      name: 'list payment requests',
      service: 'payment-requests',
      method: 'GET',
      path: '/payment-requests?limit=1',
      expectStatus: 200,
    },
    {
      name: 'list subscriptions',
      service: 'subscriptions',
      method: 'GET',
      path: '/subscriptions?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'list refunds',
      service: 'refunds',
      method: 'GET',
      path: '/refunds?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'list payouts',
      service: 'payouts',
      method: 'GET',
      path: '/payouts?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'list disputes',
      service: 'disputes',
      method: 'GET',
      path: '/disputes?pageSize=1',
      expectStatus: 200,
    },
    {
      name: 'list products',
      service: 'products',
      method: 'GET',
      path: '/products?limit=1',
      expectStatus: 200,
    },
    {
      name: 'list webhooks',
      service: 'webhooks',
      method: 'GET',
      path: '/webhooks',
      expectStatus: 200,
    },
    {
      name: 'api request logs',
      service: 'logs',
      method: 'GET',
      path: '/logs?type=api_request&limit=5',
      expectStatus: 200,
      validate: (_ctx, res) =>
        validateLogsListResponse(res.data, 'api_request', {
          minEntries: 1,
          requireUsefulFields: true,
        }),
    },
  ];
}
