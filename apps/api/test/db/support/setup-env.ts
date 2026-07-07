import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Load the API `.env` (git-ignored) so `SUPABASE_DB_TEST_URL` and friends are
 * available to the DB integration suite without exporting them by hand.
 * Existing process env always wins (e.g. CI secrets).
 */
const envPath = join(__dirname, '..', '..', '..', '.env');
if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}
