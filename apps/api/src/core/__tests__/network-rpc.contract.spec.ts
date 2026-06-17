import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Static contract: Network flows call these Supabase RPC names.
 * If SQL renames an RPC, update services and this list so drift is caught in CI.
 */
const NETWORK_API_RPC_NAMES = [
  'verify_api_key_context',
  'resolve_network_request_context',
  'fetch_network_provider_settings_for_api',
  'fetch_network_transactions_for_api',
  'get_network_transaction_for_api',
  'fetch_network_refunds_for_api',
  'get_network_refund_for_api',
  'fetch_network_customers_for_api',
  'get_network_customer_for_api',
  'record_network_transaction_context',
  'record_network_operator_fee_entry',
  'record_network_operator_fee_reversal',
  'calculate_network_operator_fee',
  'enqueue_network_webhook_event',
  'upsert_network_customer_metadata_for_api',
] as const;

const NETWORK_DASHBOARD_RPC_NAMES = [
  'approve_network_operator',
  'fetch_network_overview_metrics',
  'fetch_network_members',
  'fetch_network_enrollments',
  'fetch_network_transactions',
  'fetch_network_operator_fee_entries',
  'fetch_network_operator_fee_rules',
  'fetch_member_connected_operators',
  'fetch_network_organization_context',
  'fetch_network_customers',
  'cancel_network_enrollment_session',
  'create_network_enrollment_session',
  'complete_network_enrollment_with_profile',
  'fetch_network_enrollment_session',
  'set_network_membership_status',
  'set_network_capability_grant',
  'upsert_network_operator_fee_rule',
] as const;

const NETWORK_ADMIN_RPC_NAMES = [
  'fetch_admin_network_overview',
  'fetch_admin_network_timeseries',
  'fetch_admin_network_operators',
] as const;

function readMigration(relativePath: string): string {
  const repoRoot = join(__dirname, '../../../../..');
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function assertRpcDefinedInSql(sql: string, rpcName: string): void {
  const pattern = new RegExp(
    `CREATE OR REPLACE FUNCTION public\\.${rpcName}\\(`,
  );
  expect(pattern.test(sql)).toBe(true);
}

describe('Network Supabase RPC identifiers (contract)', () => {
  const networkFunctionsSql = readMigration(
    'apps/dashboard/supabase/migrations/20250226000105_network_functions.sql',
  );
  const networkPaymentWebhookSql = readMigration(
    'apps/dashboard/supabase/migrations/20250226000106_network_payment_complete_webhook.sql',
  );
  const apiSystemSql = readMigration(
    'apps/dashboard/supabase/migrations/20250226000058_api_system.sql',
  );

  it('lists unique RPC names relied upon by Network API flows', () => {
    expect(new Set(NETWORK_API_RPC_NAMES).size).toBe(
      NETWORK_API_RPC_NAMES.length,
    );
  });

  it('lists unique RPC names relied upon by Network dashboard flows', () => {
    expect(new Set(NETWORK_DASHBOARD_RPC_NAMES).size).toBe(
      NETWORK_DASHBOARD_RPC_NAMES.length,
    );
  });

  it('defines dashboard Network RPCs in 20250226000105_network_functions.sql', () => {
    for (const rpcName of NETWORK_DASHBOARD_RPC_NAMES) {
      assertRpcDefinedInSql(networkFunctionsSql, rpcName);
    }
    for (const rpcName of NETWORK_ADMIN_RPC_NAMES) {
      assertRpcDefinedInSql(networkFunctionsSql, rpcName);
    }
  });

  it('defines API Network RPCs across network_functions and api_system migrations', () => {
    for (const rpcName of NETWORK_API_RPC_NAMES) {
      if (rpcName === 'verify_api_key_context') {
        assertRpcDefinedInSql(apiSystemSql, rpcName);
        continue;
      }
      assertRpcDefinedInSql(networkFunctionsSql, rpcName);
    }
  });

  it('defines checkout-session network attachment trigger in network_functions migration', () => {
    expect(networkFunctionsSql).toContain(
      'attach_network_context_to_transaction_from_checkout',
    );
    expect(networkFunctionsSql).toContain(
      'trigger_attach_network_context_to_transaction_from_checkout',
    );
  });

  it('defines direct-charge payment completion webhook trigger', () => {
    expect(networkPaymentWebhookSql).toContain(
      'enqueue_network_payment_webhooks_on_transaction_complete',
    );
    expect(networkPaymentWebhookSql).toContain(
      'trigger_enqueue_network_payment_webhooks_on_transaction_complete',
    );
  });
});
