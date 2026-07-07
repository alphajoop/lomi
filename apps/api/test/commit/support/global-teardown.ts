import { closePool } from './client';

export default async function globalTeardown(): Promise<void> {
  await closePool();
}
