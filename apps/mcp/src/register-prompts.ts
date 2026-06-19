import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolsManifest } from './manifest.js';

function findToolName(manifest: ToolsManifest, substring: string): string {
  return (
    manifest.tools.find((x) => x.name.includes(substring))?.name ?? substring
  );
}

export function registerLomiPrompts(
  server: McpServer,
  manifest: ToolsManifest,
): void {
  const createProduct = findToolName(manifest, 'lomi_post_products');
  const createCheckout = findToolName(manifest, 'lomi_post_checkout_sessions');
  const createWebhook = findToolName(manifest, 'lomi_post_webhooks');
  const listTransactions = findToolName(manifest, 'lomi_get_transactions');
  const getTransaction = findToolName(manifest, 'lomi_get_transactions_');
  const testWebhook =
    manifest.tools.find(
      (t) => t.name.includes('webhooks') && t.name.includes('test'),
    )?.name ?? 'lomi_post_webhooks_id_test';
  const listWebhookLogs = findToolName(manifest, 'lomi_get_webhook_delivery_logs');

  server.registerPrompt(
    'onboard_merchant',
    {
      title: 'Onboard a merchant on lomi.',
      description:
        'Step-by-step checklist: product, checkout session, optional webhook.',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Help me onboard on lomi. using MCP tools in this order:',
              `1. ${createProduct} — create a sellable product`,
              `2. ${createCheckout} — create a hosted checkout session`,
              `3. (optional) ${createWebhook} — register a webhook endpoint`,
              '',
              'Use idempotency_key on each write. Confirm sandbox vs production base URL first.',
              'Use lomi_search_tools if you need to find a different tool.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'debug_failed_payment',
    {
      title: 'Debug a failed payment',
      description: 'Investigate a transaction using read-only list/get tools.',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'A payment failed. Investigate using MCP tools:',
              `1. ${listTransactions} — list recent transactions with filters`,
              `2. ${getTransaction} — fetch the specific transaction by id`,
              '3. Check related customer and subscription tools if applicable',
              '',
              'Do not issue refunds or cancels until the root cause is identified.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'setup_webhook',
    {
      title: 'Set up a webhook',
      description: 'Create and test a webhook endpoint.',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Set up webhooks on lomi.:',
              `1. ${createWebhook} — create endpoint with target URL and events`,
              `2. ${testWebhook} — send a test delivery`,
              `3. ${listWebhookLogs} — verify deliveries`,
              '',
              'Use idempotency_key on create.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'setup_network_operator',
    {
      title: 'Set up a Network operator flow',
      description:
        'Operator checklist: invite a member, activate membership, run delegated checkout.',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Help me operate lomi. Network as an approved operator:',
              '1. Confirm operator status in the dashboard Network panel (Members, Enrollments).',
              `2. Create an enrollment invite (dashboard or assistant create_network_enrollment_invite).`,
              '3. Share the enrollment link: https://dashboard.lomi.africa/network/enroll/{token}',
              '4. After the member completes enrollment, activate the membership (pending_review → active).',
              '5. Capabilities auto-grant on activation from requested_capabilities.',
              `6. ${createCheckout} — first delegated payment with header Lomi-Account: acct_...`,
              '',
              'Use sandbox keys first. Document each step outcome.',
            ].join('\n'),
          },
        },
      ],
    }),
  );
}
