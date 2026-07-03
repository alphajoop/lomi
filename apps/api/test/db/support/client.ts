import { Client, Pool, type PoolClient, type QueryResult } from 'pg';

/**
 * DB integration harness for exercising the real Postgres RPC logic that the
 * API relies on (transactions, subscriptions, renewal, usage billing, refunds,
 * checkout, payouts, discounts).
 *
 * These tests connect to a DEDICATED test Supabase instance (never a local
 * `supabase db reset` stack) via a Postgres connection string in the env var
 * `SUPABASE_DB_TEST_URL` (fallbacks: `TEST_DATABASE_URL`, `DATABASE_URL_TEST`).
 *
 * Isolation model: every test runs inside a single transaction that is ALWAYS
 * rolled back. Postgres functions execute in the caller's transaction (they are
 * not autonomous), so RPC writes + trigger side effects are fully reverted and
 * no external webhooks/emails fire (pg_net only sends on COMMIT). The shared
 * instance is therefore never mutated.
 */

const CONNECTION_ENV_KEYS = [
  'SUPABASE_DB_TEST_URL',
  'TEST_DATABASE_URL',
  'DATABASE_URL_TEST',
] as const;

export function getConnectionString(): string | undefined {
  for (const key of CONNECTION_ENV_KEYS) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

export function hasTestDb(): boolean {
  return getConnectionString() !== undefined;
}

/**
 * Use `dbDescribe` instead of `describe` for DB suites so the suite is skipped
 * (not failed) when no test-instance connection string is configured. This
 * keeps `pnpm test` (hermetic unit tests) green while `pnpm test:db` runs the
 * real integration suite when credentials are present.
 *
 * `typeof describe` guards module evaluation in non-test contexts (e.g. Jest's
 * globalTeardown), where the test globals are not defined.
 */
export const dbDescribe: jest.Describe =
  typeof describe === 'undefined'
    ? ((() => {}) as unknown as jest.Describe)
    : hasTestDb()
      ? describe
      : describe.skip;

function requiresSsl(connectionString: string): boolean {
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (/localhost|127\.0\.0\.1|::1/.test(connectionString)) return false;
  return true;
}

let pool: Pool | undefined;

export function getPool(): Pool {
  if (pool) return pool;
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      `No test database connection string. Set one of: ${CONNECTION_ENV_KEYS.join(', ')}`,
    );
  }
  pool = new Pool({
    connectionString,
    ssl: requiresSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
    max: 4,
    // Fail fast rather than hanging the whole suite on a bad connection string.
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

/**
 * Verify connectivity once before the suite runs so a bad connection string
 * surfaces as a clear error instead of every test timing out.
 */
export async function assertCanConnect(): Promise<void> {
  const client = new Client({
    connectionString: getConnectionString(),
    ssl: requiresSsl(getConnectionString() ?? '')
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

/**
 * Supabase RPCs check `auth.role()` / `auth.uid()`, which read the request JWT
 * GUCs. We connect as the `postgres` superuser (so seeding + SECURITY DEFINER
 * functions all work and RLS is bypassed) and inject a `service_role` claim so
 * the in-function permission branches take the service-role path.
 */
async function applyServiceRoleClaims(client: Db): Promise<void> {
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ role: 'service_role' }),
  ]);
  await client.query(
    "SELECT set_config('request.jwt.claim.role', 'service_role', true)",
  );
}

/**
 * Override the request claims mid-test (e.g. to impersonate a specific merchant
 * auth user for dashboard/permission-gated RPCs). `sub` maps to `auth.uid()`.
 */
export async function setRequestClaims(
  client: Db,
  claims: Record<string, unknown>,
): Promise<void> {
  await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
    JSON.stringify(claims),
  ]);
  if (typeof claims.role === 'string') {
    await client.query(
      "SELECT set_config('request.jwt.claim.role', $1, true)",
      [claims.role],
    );
  }
  if (typeof claims.sub === 'string') {
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [
      claims.sub,
    ]);
  }
}

/**
 * Run `fn` inside a transaction that is always rolled back. Zero residue.
 */
export async function withRollback<T>(
  fn: (client: Db) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await applyServiceRoleClaims(client);
    try {
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
    }
  } finally {
    client.release();
  }
}

type FnArgValue = unknown;

/**
 * Call a Postgres function using named-argument syntax so tests are robust to
 * parameter ordering. Plain objects/arrays are JSON-encoded for jsonb params.
 * Returns the full QueryResult (`SELECT * FROM fn(...) AS result`), so:
 *  - scalar-returning fns → `res.rows[0].result`
 *  - TABLE/SETOF-returning fns → `res.rows` with the declared column names
 */
export async function callFn(
  client: Db,
  fnName: string,
  args: Record<string, FnArgValue>,
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

/**
 * Convenience wrapper for scalar-returning functions.
 */
export async function callScalar<T = unknown>(
  client: Db,
  fnName: string,
  args: Record<string, FnArgValue>,
): Promise<T> {
  const res = await callFn(client, fnName, args);
  return res.rows[0]?.result as T;
}

/**
 * Assert that calling `fnName` raises a Postgres exception whose message
 * matches `pattern`. Returns the caught error for further assertions.
 */
export async function expectRpcError(
  client: Db,
  fnName: string,
  args: Record<string, FnArgValue>,
  pattern: RegExp,
): Promise<Error> {
  try {
    await callFn(client, fnName, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!pattern.test(message)) {
      throw new Error(
        `${fnName} raised an error but it did not match ${pattern}. Actual: ${message}`,
      );
    }
    return error as Error;
  }
  throw new Error(`Expected ${fnName} to raise an error matching ${pattern}`);
}
