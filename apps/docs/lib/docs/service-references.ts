/* @proprietary license */

import type { Language } from '@/lib/i18n/config';
import { mcpTwinHref } from '@/lib/mcp-twins';

export type TaskGuideKey =
  | 'take-a-payment'
  | 'bill-monthly'
  | 'meter-usage'
  | 'pay-out'
  | 'refunds-and-disputes'
  | 'reconcile-settlements';

export type ServiceTransport = 'api' | 'sdk' | 'cli' | 'mcp';

export type ServiceReference = {
  id: string;
  transport: ServiceTransport;
  title: string;
  identifier: string;
  href: string;
  hrefLabel: string;
  notes: readonly string[];
  sample: { language: string; code: string };
  defaultOpen?: boolean;
};

const copy = {
  en: {
    restHref: 'Open the REST reference',
    sdkHref: 'Open the TypeScript SDK',
    cliHref: 'Open the CLI guide',
    mcpHref: 'Open the MCP twin',
    restAuth:
      'Header X-API-KEY. Env: LOMI_SECRET_KEY. Sandbox host: sandbox.api.lomi.africa.',
    sdkAuth:
      'new LomiSDK({ apiKey: process.env.LOMI_SECRET_KEY, environment: "sandbox" }).',
    cliAuth: 'lomi login, then the CLI sends X-API-KEY from your session.',
    mcpAuth:
      'Hosted MCP at https://mcp.lomi.africa/mcp. OAuth or x-lomi-api-key.',
    takePaymentApi: 'Create a hosted checkout session',
    takePaymentSdk: 'Create the session from application code',
    takePaymentCli: 'Create the session from the terminal',
    takePaymentMcp: 'Create the session from an agent',
    billApi: 'Create a monthly product, then a checkout session',
    billSdk: 'Create a recurring product from code',
    billCli: 'Checkout against a recurring product',
    billMcp: 'Create the product, then checkout',
    meterApi: 'Create a meter and a usage subscription',
    meterSdk: 'Meter setup from code',
    meterCli: 'CLI has no usage create command; use REST or MCP',
    meterMcp: 'Create the meter and enroll the customer',
    payoutApi: 'Send funds to yourself or a beneficiary',
    payoutSdk: 'Create a payout from code',
    payoutCli: 'Create a payout from the terminal',
    payoutMcp: 'Create a payout from an agent',
    refundApi: 'Refund a completed transaction',
    refundSdk: 'Create a refund from code',
    refundCli: 'Create a refund from the terminal',
    refundMcp: 'Create a refund from an agent',
    settleApi: 'List settlement periods',
    settleSdk: 'List settlements from code',
    settleCli: 'List transactions for reconciliation',
    settleMcp: 'List settlement periods from an agent',
  },
  fr: {
    restHref: 'Ouvrir la référence REST',
    sdkHref: 'Ouvrir le SDK TypeScript',
    cliHref: 'Ouvrir le guide CLI',
    mcpHref: 'Ouvrir le jumeau MCP',
    restAuth:
      'En-tête X-API-KEY. Variable : LOMI_SECRET_KEY. Hôte sandbox : sandbox.api.lomi.africa.',
    sdkAuth:
      'new LomiSDK({ apiKey: process.env.LOMI_SECRET_KEY, environment: "sandbox" }).',
    cliAuth: 'lomi login, puis la CLI envoie X-API-KEY depuis la session.',
    mcpAuth:
      'MCP hébergé sur https://mcp.lomi.africa/mcp. OAuth ou x-lomi-api-key.',
    takePaymentApi: 'Créer une session de checkout hébergé',
    takePaymentSdk: 'Créer la session depuis le code',
    takePaymentCli: 'Créer la session depuis le terminal',
    takePaymentMcp: 'Créer la session depuis un agent',
    billApi: 'Créer un produit mensuel, puis une session checkout',
    billSdk: 'Créer un produit récurrent depuis le code',
    billCli: 'Checkout sur un produit récurrent',
    billMcp: 'Créer le produit, puis le checkout',
    meterApi: 'Créer un compteur et un abonnement d’usage',
    meterSdk: 'Configurer le compteur depuis le code',
    meterCli: 'Pas de commande CLI d’usage ; utilisez REST ou MCP',
    meterMcp: 'Créer le compteur et inscrire le client',
    payoutApi: 'Envoyer des fonds vers soi ou un bénéficiaire',
    payoutSdk: 'Créer un payout depuis le code',
    payoutCli: 'Créer un payout depuis le terminal',
    payoutMcp: 'Créer un payout depuis un agent',
    refundApi: 'Rembourser une transaction completed',
    refundSdk: 'Créer un remboursement depuis le code',
    refundCli: 'Créer un remboursement depuis le terminal',
    refundMcp: 'Créer un remboursement depuis un agent',
    settleApi: 'Lister les périodes de settlement',
    settleSdk: 'Lister les settlements depuis le code',
    settleCli: 'Lister les transactions pour réconcilier',
    settleMcp: 'Lister les périodes depuis un agent',
  },
} as const;

const CHECKOUT_CURL = `curl -sS -X POST "https://sandbox.api.lomi.africa/checkout-sessions" \\
  -H "X-API-Key: $LOMI_SECRET_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency_code": "XOF",
    "title": "Test order",
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel"
  }'`;

const CHECKOUT_SDK = `const session = await lomi.checkoutSessions.create({
  amount: 10000,
  currency_code: 'XOF',
  title: 'Test order',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
});
console.log(session.checkout_url);`;

const CHECKOUT_CLI = `lomi checkout create --amount 10000 --currency XOF \\
  --success-url https://example.com/success \\
  --cancel-url https://example.com/cancel --json`;

const CHECKOUT_MCP = `{
  "action": "create",
  "idempotency_key": "ord_123",
  "body": {
    "amount": 10000,
    "currency_code": "XOF",
    "title": "Test order",
    "success_url": "https://example.com/success",
    "cancel_url": "https://example.com/cancel"
  }
}`;

const PRODUCT_CURL = `curl -sS -X POST "https://sandbox.api.lomi.africa/products" \\
  -H "X-API-Key: $LOMI_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Premium Plan",
    "product_type": "recurring",
    "prices": [{
      "amount": 15000,
      "currency_code": "XOF",
      "billing_interval": "month",
      "is_default": true
    }]
  }'`;

const PRODUCT_SDK = `const product = await lomi.products.create({
  name: 'Premium Plan',
  description: 'Monthly premium access',
  product_type: 'recurring',
  prices: [
    {
      amount: 15000,
      currency_code: 'XOF',
      billing_interval: 'month',
      is_default: true,
    },
  ],
});`;

const PRODUCT_CLI = `lomi products list
lomi checkout create --price-id price_... --currency XOF \\
  --success-url https://example.com/success \\
  --cancel-url https://example.com/cancel --json`;

const PRODUCT_MCP = `{
  "action": "create",
  "body": {
    "name": "Premium Plan",
    "product_type": "recurring",
    "prices": [{
      "amount": 15000,
      "currency_code": "XOF",
      "billing_interval": "month",
      "is_default": true
    }]
  }
}`;

const METER_CURL = `curl -sS -X POST "https://sandbox.api.lomi.africa/meters" \\
  -H "X-API-Key: $LOMI_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "api_calls",
    "product_id": "prod_...",
    "filter": { "code": "api_calls" },
    "aggregation": { "type": "sum", "property": "quantity" }
  }'`;

const METER_SDK = `const meter = await lomi.meters.create({
  name: 'api_calls',
  product_id: 'prod_...',
  filter: { code: 'api_calls' },
  aggregation: { type: 'sum', property: 'quantity' },
});
await lomi.usage.createSubscription({
  customer_id: 'cus_...',
  product_id: 'prod_...',
});`;

const METER_CLI = `# No usage create command in the CLI yet.
# Use REST POST /meters and POST /usage/subscriptions, or MCP lomi_meters / lomi_usage.`;

const METER_MCP = `{
  "action": "create",
  "body": {
    "name": "api_calls",
    "product_id": "prod_...",
    "filter": { "code": "api_calls" },
    "aggregation": { "type": "sum", "property": "quantity" }
  }
}`;

const PAYOUT_CURL = `curl -sS -X POST "https://api.lomi.africa/payouts" \\
  -H "X-API-Key: $LOMI_SECRET_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination": "self",
    "rail": "wave",
    "amount": 50000,
    "currency_code": "XOF",
    "payout_method_id": "550e8400-e29b-41d4-a716-446655440000"
  }'`;

const PAYOUT_SDK = `await lomi.payouts.create({
  destination: 'self',
  rail: 'wave',
  amount: 50000,
  currency_code: 'XOF',
  payout_method_id: '550e8400-e29b-41d4-a716-446655440000',
});`;

const PAYOUT_CLI = `lomi payouts create --destination self --rail wave \\
  --amount 50000 --currency XOF --payout-method-id 550e8400-e29b-41d4-a716-446655440000`;

const PAYOUT_MCP = `{
  "action": "create",
  "idempotency_key": "payout_123",
  "body": {
    "destination": "self",
    "rail": "wave",
    "amount": 50000,
    "currency_code": "XOF",
    "payout_method_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}`;

const REFUND_CURL = `curl -sS -X POST "https://sandbox.api.lomi.africa/refunds" \\
  -H "X-API-Key: $LOMI_SECRET_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 5000
  }'`;

const REFUND_SDK = `const refund = await lomi.refunds.create({
  transaction_id: '123e4567-e89b-12d3-a456-426614174000',
  amount: 5000,
});`;

const REFUND_CLI = `lomi refunds create --transaction-id 123e4567-e89b-12d3-a456-426614174000 --amount 5000`;

const REFUND_MCP = `{
  "action": "create",
  "idempotency_key": "refund_123",
  "body": {
    "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 5000
  }
}`;

const SETTLE_CURL = `curl -sS "https://sandbox.api.lomi.africa/settlements" \\
  -H "X-API-Key: $LOMI_SECRET_KEY"`;

const SETTLE_SDK = `const periods = await lomi.settlements.findAll();
const rows = await lomi.settlements.findTransactions('XOF:2026-06-01');`;

const SETTLE_CLI = `lomi transactions list --json`;

const SETTLE_MCP = `{ "action": "list" }`;

function surfaces(
  items: {
    id: string;
    transport: ServiceTransport;
    title: string;
    identifier: string;
    href: string;
    hrefLabel: string;
    notes: readonly string[];
    sample: { language: string; code: string };
    defaultOpen?: boolean;
  }[],
): ServiceReference[] {
  return items.map((item) => ({ ...item }));
}

export const TASK_GUIDE_KEYS: readonly TaskGuideKey[] = [
  'take-a-payment',
  'bill-monthly',
  'meter-usage',
  'pay-out',
  'refunds-and-disputes',
  'reconcile-settlements',
];

export function getTaskReferences(
  task: TaskGuideKey,
  locale: Language,
): readonly ServiceReference[] {
  const t = copy[locale];

  switch (task) {
    case 'take-a-payment':
      return surfaces([
        {
          id: 'api',
          transport: 'api',
          title: t.takePaymentApi,
          identifier: 'POST /checkout-sessions',
          href: '/api/checkout-sessions/CheckoutSessionsController_create',
          hrefLabel: t.restHref,
          notes: [
            t.restAuth,
            'Do not fulfill until webhooks + GET /transactions/{id}.',
          ],
          sample: { language: 'bash', code: CHECKOUT_CURL },
          defaultOpen: true,
        },
        {
          id: 'sdk',
          transport: 'sdk',
          title: t.takePaymentSdk,
          identifier: 'lomi.checkoutSessions.create',
          href: '/build/sdks/typescript',
          hrefLabel: t.sdkHref,
          notes: [t.sdkAuth],
          sample: { language: 'typescript', code: CHECKOUT_SDK },
        },
        {
          id: 'cli',
          transport: 'cli',
          title: t.takePaymentCli,
          identifier: 'lomi checkout create',
          href: '/build/cli',
          hrefLabel: t.cliHref,
          notes: [t.cliAuth],
          sample: { language: 'bash', code: CHECKOUT_CLI },
        },
        {
          id: 'mcp',
          transport: 'mcp',
          title: t.takePaymentMcp,
          identifier: 'lomi_checkout action=create',
          href: mcpTwinHref('lomi_checkout', 'create'),
          hrefLabel: t.mcpHref,
          notes: [t.mcpAuth],
          sample: { language: 'json', code: CHECKOUT_MCP },
        },
      ]);
    case 'bill-monthly':
      return surfaces([
        {
          id: 'api',
          transport: 'api',
          title: t.billApi,
          identifier: 'POST /products',
          href: '/api/products/ProductsController_create',
          hrefLabel: t.restHref,
          notes: [
            t.restAuth,
            'There is no standalone create-subscription signup API. Recurring checkout creates the instance after the first payment.',
          ],
          sample: { language: 'bash', code: PRODUCT_CURL },
          defaultOpen: true,
        },
        {
          id: 'sdk',
          transport: 'sdk',
          title: t.billSdk,
          identifier: 'lomi.products.create',
          href: '/build/sdks/typescript',
          hrefLabel: t.sdkHref,
          notes: [t.sdkAuth],
          sample: { language: 'typescript', code: PRODUCT_SDK },
        },
        {
          id: 'cli',
          transport: 'cli',
          title: t.billCli,
          identifier: 'lomi products list',
          href: '/build/cli',
          hrefLabel: t.cliHref,
          notes: [t.cliAuth],
          sample: { language: 'bash', code: PRODUCT_CLI },
        },
        {
          id: 'mcp',
          transport: 'mcp',
          title: t.billMcp,
          identifier: 'lomi_products action=create',
          href: mcpTwinHref('lomi_products', 'create'),
          hrefLabel: t.mcpHref,
          notes: [t.mcpAuth],
          sample: { language: 'json', code: PRODUCT_MCP },
        },
      ]);
    case 'meter-usage':
      return surfaces([
        {
          id: 'api',
          transport: 'api',
          title: t.meterApi,
          identifier: 'POST /meters',
          href: '/api/meters/MetersController_create',
          hrefLabel: t.restHref,
          notes: [
            t.restAuth,
            'Then POST /usage/subscriptions and POST /usage/events.',
          ],
          sample: { language: 'bash', code: METER_CURL },
          defaultOpen: true,
        },
        {
          id: 'sdk',
          transport: 'sdk',
          title: t.meterSdk,
          identifier: 'lomi.meters.create',
          href: '/build/sdks/typescript',
          hrefLabel: t.sdkHref,
          notes: [t.sdkAuth],
          sample: { language: 'typescript', code: METER_SDK },
        },
        {
          id: 'cli',
          transport: 'cli',
          title: t.meterCli,
          identifier: 'lomi',
          href: '/build/cli',
          hrefLabel: t.cliHref,
          notes: [t.cliAuth],
          sample: { language: 'bash', code: METER_CLI },
        },
        {
          id: 'mcp',
          transport: 'mcp',
          title: t.meterMcp,
          identifier: 'lomi_meters action=create',
          href: mcpTwinHref('lomi_meters', 'create'),
          hrefLabel: t.mcpHref,
          notes: [t.mcpAuth],
          sample: { language: 'json', code: METER_MCP },
        },
      ]);
    case 'pay-out':
      return surfaces([
        {
          id: 'api',
          transport: 'api',
          title: t.payoutApi,
          identifier: 'POST /payouts',
          href: '/api/payouts/PayoutsUnifiedController_create',
          hrefLabel: t.restHref,
          notes: [
            t.restAuth,
            'Wave and MTN payouts need a live key. Test keys return 400 for mobile-money payouts.',
          ],
          sample: { language: 'bash', code: PAYOUT_CURL },
          defaultOpen: true,
        },
        {
          id: 'sdk',
          transport: 'sdk',
          title: t.payoutSdk,
          identifier: 'lomi.payouts.create',
          href: '/build/sdks/typescript',
          hrefLabel: t.sdkHref,
          notes: [t.sdkAuth],
          sample: { language: 'typescript', code: PAYOUT_SDK },
        },
        {
          id: 'cli',
          transport: 'cli',
          title: t.payoutCli,
          identifier: 'lomi payouts create',
          href: '/build/cli',
          hrefLabel: t.cliHref,
          notes: [t.cliAuth],
          sample: { language: 'bash', code: PAYOUT_CLI },
        },
        {
          id: 'mcp',
          transport: 'mcp',
          title: t.payoutMcp,
          identifier: 'lomi_payouts action=create',
          href: mcpTwinHref('lomi_payouts', 'create'),
          hrefLabel: t.mcpHref,
          notes: [t.mcpAuth],
          sample: { language: 'json', code: PAYOUT_MCP },
        },
      ]);
    case 'refunds-and-disputes':
      return surfaces([
        {
          id: 'api',
          transport: 'api',
          title: t.refundApi,
          identifier: 'POST /refunds',
          href: '/api/refunds/RefundsController_create',
          hrefLabel: t.restHref,
          notes: [
            t.restAuth,
            'Refunds apply to completed transactions. Card disputes: GET /disputes.',
          ],
          sample: { language: 'bash', code: REFUND_CURL },
          defaultOpen: true,
        },
        {
          id: 'sdk',
          transport: 'sdk',
          title: t.refundSdk,
          identifier: 'lomi.refunds.create',
          href: '/build/sdks/typescript',
          hrefLabel: t.sdkHref,
          notes: [t.sdkAuth],
          sample: { language: 'typescript', code: REFUND_SDK },
        },
        {
          id: 'cli',
          transport: 'cli',
          title: t.refundCli,
          identifier: 'lomi refunds create',
          href: '/build/cli',
          hrefLabel: t.cliHref,
          notes: [t.cliAuth],
          sample: { language: 'bash', code: REFUND_CLI },
        },
        {
          id: 'mcp',
          transport: 'mcp',
          title: t.refundMcp,
          identifier: 'lomi_refunds action=create',
          href: mcpTwinHref('lomi_refunds', 'create'),
          hrefLabel: t.mcpHref,
          notes: [t.mcpAuth],
          sample: { language: 'json', code: REFUND_MCP },
        },
      ]);
    case 'reconcile-settlements':
      return surfaces([
        {
          id: 'api',
          transport: 'api',
          title: t.settleApi,
          identifier: 'GET /settlements',
          href: '/api/settlements/SettlementsController_findAll',
          hrefLabel: t.restHref,
          notes: [
            t.restAuth,
            'Settlement id format is {currency}:{YYYY-MM-DD} (UTC).',
          ],
          sample: { language: 'bash', code: SETTLE_CURL },
          defaultOpen: true,
        },
        {
          id: 'sdk',
          transport: 'sdk',
          title: t.settleSdk,
          identifier: 'lomi.settlements.findAll',
          href: '/build/sdks/typescript',
          hrefLabel: t.sdkHref,
          notes: [t.sdkAuth],
          sample: { language: 'typescript', code: SETTLE_SDK },
        },
        {
          id: 'cli',
          transport: 'cli',
          title: t.settleCli,
          identifier: 'lomi transactions list',
          href: '/build/cli',
          hrefLabel: t.cliHref,
          notes: [t.cliAuth],
          sample: { language: 'bash', code: SETTLE_CLI },
        },
        {
          id: 'mcp',
          transport: 'mcp',
          title: t.settleMcp,
          identifier: 'lomi_settlements action=list',
          href: mcpTwinHref('lomi_settlements', 'list'),
          hrefLabel: t.mcpHref,
          notes: [t.mcpAuth],
          sample: { language: 'json', code: SETTLE_MCP },
        },
      ]);
    default: {
      const _exhaustive: never = task;
      return _exhaustive;
    }
  }
}
