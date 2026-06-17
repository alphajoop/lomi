import { createMDX } from 'fumadocs-mdx/next';
import fs from 'node:fs';
import path from 'node:path';

const withMDX = createMDX();

/**
 * Legacy flat URLs `/api/:operationId` -> canonical grouped `/api/:section/:operationId`.
 */
async function legacyApiRedirects() {
  const apiDocsRoot = path.join(process.cwd(), 'content/docs/api');
  const redirects = [];

  try {
    for (const name of fs.readdirSync(apiDocsRoot, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const segment = name.name;
      if (segment.startsWith('.')) continue;

      const dirPath = path.join(apiDocsRoot, segment);
      for (const file of fs.readdirSync(dirPath)) {
        if (!file.endsWith('.mdx') || file.startsWith('_')) continue;
        const base = file.replace(/\.mdx$/, '');
        redirects.push({
          source: `/api/${encodeURI(base)}`,
          destination: `/api/${encodeURI(segment)}/${encodeURI(base)}`,
          permanent: false,
        });
      }
    }
  } catch {
    // noop if missing during tooling
  }

  return redirects;
}

function legacyDocsRedirects() {
  return [
    {
      source: '/introduction/what-is-lomi',
      destination: '/start/overview',
    },
    {
      source: '/core/introduction/what-is-lomi',
      destination: '/start/overview',
    },
    {
      source: '/core/introduction/manifesto',
      destination: '/resources/manifesto',
    },
    {
      source: '/core/introduction/community',
      destination: '/resources/community',
    },
    {
      source: '/core/fundamentals/create-account',
      destination: '/start/create-account',
    },
    {
      source: '/core/fundamentals/access-tokens',
      destination: '/start/api-keys',
    },
    { source: '/core/fundamentals/webhooks', destination: '/build/webhooks' },
    {
      source: '/core/fundamentals/transactions',
      destination: '/build/transactions',
    },
    {
      source: '/core/fundamentals/:path*',
      destination: '/start/integration-journey',
    },
    {
      source: '/build/fundamentals',
      destination: '/start/integration-journey',
    },
    {
      source: '/build/fundamentals/create-account',
      destination: '/start/create-account',
    },
    {
      source: '/build/fundamentals/access-tokens',
      destination: '/start/api-keys',
    },
    {
      source: '/build/fundamentals/webhooks',
      destination: '/build/webhooks',
    },
    {
      source: '/build/fundamentals/transactions',
      destination: '/build/transactions',
    },
    {
      source: '/build/fundamentals/:path*',
      destination: '/start/integration-journey',
    },
    {
      source: '/build/payment-channels',
      destination: '/build/guides/payment-methods',
    },
    {
      source: '/build/payment-channels/:path*',
      destination: '/build/guides/payment-methods',
    },
    {
      source: '/core/advanced-guides/:path*',
      destination: '/build/advanced-guides/:path*',
    },
    { source: '/core/lomi-cli/:path*', destination: '/build/cli/:path*' },
    {
      source: '/core/merchant-of-record/:path*',
      destination: '/resources/merchant-of-record/:path*',
    },
    {
      source: '/core/freedom/:path*',
      destination: '/resources/open-source/:path*',
    },
    {
      source: '/core/contributing/:path*',
      destination: '/resources/contributing/:path*',
    },
    { source: '/core/support/contact', destination: '/resources/support' },
    {
      source: '/reference/setup/integration',
      destination: '/start/first-payment',
    },
    {
      source: '/reference/setup/authentication',
      destination: '/api/authentication',
    },
    {
      source: '/reference/setup/sandbox-payments',
      destination: '/start/sandbox-payments',
    },
    { source: '/reference/setup/overview', destination: '/api' },
    { source: '/reference/reference/errors', destination: '/api/errors' },
    {
      source: '/reference/reference/data-models',
      destination: '/api/data-models',
    },
    {
      source: '/reference/reference/payment-state-machine',
      destination: '/api/payment-state-machine',
    },
    { source: '/reference/sdks', destination: '/build/sdks' },
    { source: '/reference/sdks/:path*', destination: '/build/sdks/:path*' },
    {
      source: '/reference/integrations',
      destination: '/build/ecommerce-extensions',
    },
    {
      source: '/reference/integrations/:path*',
      destination: '/build/ecommerce-extensions/:path*',
    },
    { source: '/reference/network', destination: '/resources/network' },
    {
      source: '/reference/changelog/changelog',
      destination: '/resources/changelog',
    },
    {
      source: '/reference/payments/checkout-sessions',
      destination: '/build/checkout',
    },
    {
      source: '/reference/payments/payment-links',
      destination: '/build/payment-links',
    },
    {
      source: '/reference/payments/payment-requests',
      destination: '/build/payment-requests',
    },
    { source: '/reference/payments/products', destination: '/build/products' },
    {
      source: '/reference/payments/subscriptions',
      destination: '/build/subscriptions',
    },
    {
      source: '/reference/payments/customer-portal',
      destination: '/build/customer-portal',
    },
    {
      source: '/reference/payments/discount-coupons',
      destination: '/build/discount-coupons',
    },
    {
      source: '/reference/payments/transactions',
      destination: '/build/transactions',
    },
    { source: '/reference/payments/refunds', destination: '/build/refunds' },
    { source: '/reference/payments/payouts', destination: '/build/payouts' },
    { source: '/reference/payments/webhooks', destination: '/build/webhooks' },
    {
      source: '/reference/payments/:path*',
      destination: '/build/payments/:path*',
    },
    {
      source: '/reference/platform/balance-and-settlement',
      destination: '/build/balance-and-settlement',
    },
    { source: '/reference/platform/accounts', destination: '/api/balances' },
    {
      source: '/reference/platform/customers',
      destination: '/build/platform/customers',
    },
    {
      source: '/reference/platform/customer-subscriptions',
      destination: '/api/subscriptions',
    },
    {
      source: '/reference/platform/webhook-delivery-logs',
      destination: '/api/webhooks',
    },
    {
      source: '/reference/platform/merchants',
      destination: '/build/platform/merchants',
    },
    {
      source: '/reference/platform/organizations',
      destination: '/build/platform/organizations',
    },
    { source: '/reference/platform/:path*', destination: '/api' },
    { source: '/build/platform/accounts', destination: '/api/balances' },
    {
      source: '/build/platform/customer-subscriptions',
      destination: '/api/subscriptions',
    },
    {
      source: '/build/platform/webhook-delivery-logs',
      destination: '/api/webhooks',
    },
    { source: '/ui', destination: '/build/lomi-ui' },
    { source: '/ui/:path*', destination: '/build/lomi-ui/:path*' },
    {
      source: '/api/accounts/AccountsController_getBalance',
      destination: '/api/balances/AccountsController_getBalance',
    },
    {
      source: '/api/accounts/AccountsController_getBalanceBreakdown',
      destination: '/api/balances/AccountsController_getBalanceBreakdown',
    },
    {
      source: '/api/accounts/AccountsController_checkAvailableBalance',
      destination: '/api/balances/AccountsController_checkAvailableBalance',
    },
    { source: '/api/accounts/:path*', destination: '/api/balances' },
    {
      source: '/api/customer-subscriptions/:path*',
      destination: '/api/subscriptions/:path*',
    },
    {
      source: '/api/webhook-delivery-logs/:path*',
      destination: '/api/webhooks/:path*',
    },
    { source: '/api/providers/:path*', destination: '/api/charge' },
    { source: '/api/merchants/:path*', destination: '/api' },
    { source: '/api/organizations/:path*', destination: '/api' },
  ].map((redirect) => ({
    ...redirect,
    permanent: false,
  }));
}

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  devIndicators: false,
  serverExternalPackages: ['prettier'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  async redirects() {
    return [...legacyDocsRedirects(), ...(await legacyApiRedirects())];
  },
};

export default withMDX(config);
