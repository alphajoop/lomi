import { Client, Pool, type PoolClient, type QueryResult } from 'pg';

/**
 * Committing DB harness for tests that require real COMMIT (pg_net, HTTP delivery
 * against persisted rows). Uses SUPABASE_DB_COMMIT_URL when set; otherwise falls
 * back to SUPABASE_DB_TEST_URL so local runs can share the integration instance.
 *
 * Every test MUST register created organization IDs via trackCleanup() so
 * afterAll can delete seeded rows. Never point at production.
 */

const CONNECTION_ENV_KEYS = [
  'SUPABASE_DB_COMMIT_URL',
  'SUPABASE_DB_TEST_URL',
  'TEST_DATABASE_URL',
  'DATABASE_URL_TEST',
] as const;

const PROD_PROJECT_HOST_FRAGMENT = 'mdswvokxrnfggrujsfjd';

export function getConnectionString(): string | undefined {
  for (const key of CONNECTION_ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      const trimmed = value.trim();
      if (trimmed.includes(PROD_PROJECT_HOST_FRAGMENT)) {
        throw new Error(
          `Refusing commit harness against production project ref in ${key}`,
        );
      }
      return trimmed;
    }
  }
  return undefined;
}

export function hasCommitDb(): boolean {
  return getConnectionString() !== undefined;
}

export const commitDescribe: jest.Describe =
  typeof describe === 'undefined'
    ? ((() => {}) as unknown as jest.Describe)
    : hasCommitDb()
      ? describe
      : describe.skip;

function requiresSsl(connectionString: string): boolean {
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (/localhost|127\.0\.0\.1|::1/.test(connectionString)) return false;
  return true;
}

let pool: Pool | undefined;

const cleanupOrganizationIds = new Set<string>();
const cleanupMerchantIds = new Set<string>();

export function trackCleanup(
  organizationId: string,
  merchantId?: string,
): void {
  cleanupOrganizationIds.add(organizationId);
  if (merchantId) {
    cleanupMerchantIds.add(merchantId);
  }
}

export async function cleanupTrackedOrganizations(): Promise<void> {
  if (cleanupOrganizationIds.size === 0 && cleanupMerchantIds.size === 0) {
    return;
  }
  const client = await getPool().connect();
  try {
    const ids = [...cleanupOrganizationIds];
    for (const organizationId of ids) {
      await client.query(
        `DELETE FROM public.webhook_delivery_logs WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.webhook_delivery_dispatches
          WHERE outbox_id IN (
            SELECT outbox_id FROM public.webhook_events_outbox
             WHERE organization_id = $1
          )`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.webhook_events_outbox WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.webhooks WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.api_keys WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.accounts WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.customers WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.merchant_organization_links WHERE organization_id = $1`,
        [organizationId],
      );
      await client.query(
        `DELETE FROM public.organizations WHERE organization_id = $1`,
        [organizationId],
      );
      cleanupOrganizationIds.delete(organizationId);
    }

    for (const merchantId of [...cleanupMerchantIds]) {
      await client.query(`DELETE FROM public.logs WHERE merchant_id = $1`, [
        merchantId,
      ]);
      await client.query(
        `DELETE FROM public.merchants WHERE merchant_id = $1`,
        [merchantId],
      );
      cleanupMerchantIds.delete(merchantId);
    }
  } finally {
    client.release();
  }
}

export function getPool(): Pool {
  if (pool) return pool;
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      `No commit database connection string. Set one of: ${CONNECTION_ENV_KEYS.join(', ')}`,
    );
  }
  pool = new Pool({
    connectionString,
    ssl: requiresSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
    max: 4,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 5_000,
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export async function assertCanConnect(): Promise<void> {
  const connectionString = getConnectionString();
  if (!connectionString) return;
  const client = new Client({
    connectionString,
    ssl: requiresSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
    connectionTimeoutMillis: 15_000,
  });
  await client.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    await client.end();
  }
}

export type Db = PoolClient;

async function applyServiceRoleClaims(client: Db): Promise<void> {
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ role: 'service_role' }),
  ]);
  await client.query(
    "SELECT set_config('request.jwt.claim.role', 'service_role', true)",
  );
}

/**
 * Run fn inside a transaction that is COMMITted. Caller must track org IDs for
 * explicit cleanup via trackCleanup().
 */
export async function withCommit<T>(
  fn: (client: Db) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await applyServiceRoleClaims(client);
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    client.release();
  }
}

export async function callFn(
  client: Db,
  fnName: string,
  args: Record<string, unknown>,
): Promise<QueryResult> {
  const keys = Object.keys(args);
  const params: unknown[] = [];
  const assignments = keys.map((key, index) => {
    let value = args[key];
    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date)
    ) {
      value = JSON.stringify(value);
    }
    params.push(value);
    return `${key} => $${index + 1}`;
  });
  const sql = `SELECT * FROM ${fnName}(${assignments.join(', ')}) AS result`;
  return client.query(sql, params);
}

export async function callScalar<T = unknown>(
  client: Db,
  fnName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const res = await callFn(client, fnName, args);
  return res.rows[0]?.result as T;
}
