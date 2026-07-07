import { closePool } from './client';

/**
 * Jest global teardown: close the shared pool so the process exits cleanly.
 */
export default async function globalTeardown(): Promise<void> {
  await closePool();
}
