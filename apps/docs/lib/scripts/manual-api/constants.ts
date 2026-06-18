/* @proprietary license */

/** Public merchant HTTP API only; omit internal/agent routes from curated docs coverage. */
export const AGENT_OPENAPI_PREFIX = '/agent';

/** Section folder order matches sidebar (first URL segment → folder name). */
export const REST_API_SECTION_ORDER = [
  'checkout-sessions',
  'payment-links',
  'payment-requests',
  'charge',
  'customers',
  'products',
  'subscriptions',
  'discount-coupons',
  'balances',
  'organizations',
  'merchants',
  'providers',
  'transactions',
  'refunds',
  'payouts',
  'settlements',
  'webhooks',
  'meters',
  'usage-events',
  'usage-billing',
] as const;

const PUBLIC_REST_API_OPERATIONS = [
  'GET /accounts/balance',
  'GET /accounts/balance/breakdown',
  'GET /accounts/balance/check/{currency}',
  'POST /charge/card',
  'GET /charge/card/{id}',
  'POST /charge/card/{id}/cancel',
  'POST /charge/mtn',
  'POST /charge/wave',
  'checkout-sessions',
  'customers',
  'customer-subscriptions',
  'discount-coupons',
  'payment-links',
  'payment-requests',
  'payouts',
  'settlements',
  'products',
  'refunds',
  'subscriptions',
  'transactions',
  'webhook-delivery-logs',
  'webhooks',
  'organizations',
  'merchants',
  'providers',
  'meters',
  'usage-events',
  'usage-subscriptions',
  'usage-billing',
] as const;

export type RestApiFolder = (typeof REST_API_SECTION_ORDER)[number];

function operationKey(method: string, route: string): string {
  return `${method.toUpperCase()} ${route}`;
}

function routeHasPublicOperation(route: string): boolean {
  return PUBLIC_REST_API_OPERATIONS.some((entry) => {
    if (entry.includes(' ')) return entry.endsWith(` ${route}`);
    return route === `/${entry}` || route.startsWith(`/${entry}/`);
  });
}

export function pathToFolder(route: string): string {
  const parts = route.split('/').filter(Boolean);
  const first = parts[0];
  if (!first) return 'general';
  if (first === 'accounts') return 'balances';
  if (first === 'customer-subscriptions') return 'subscriptions';
  if (first === 'webhook-delivery-logs') return 'webhooks';
  if (first === 'usage-subscriptions') return 'usage-events';
  return first;
}

export function isAgentRoute(route: string): boolean {
  return (
    route.startsWith(`${AGENT_OPENAPI_PREFIX}/`) ||
    route === AGENT_OPENAPI_PREFIX
  );
}

export function isPublicRestApiRoute(route: string): boolean {
  return !isAgentRoute(route) && routeHasPublicOperation(route);
}

export function isPublicRestApiOperation(
  method: string,
  route: string,
): boolean {
  const key = operationKey(method, route);
  return PUBLIC_REST_API_OPERATIONS.some((entry) => {
    if (entry.includes(' ')) return entry === key;
    return route === `/${entry}` || route.startsWith(`/${entry}/`);
  });
}
