import { randomUUID } from 'node:crypto';
import { createLiveChecks } from './checks/live';
import { createSandboxChecks } from './checks/sandbox';
import { buildReport, printReport, writeReport } from './report';
import { runSuite } from './runner';
import type { SuiteContext, SuiteName, SuiteResult } from './types';

type OnlyMode = SuiteName | 'all';

function parseArgs(argv: string[]): OnlyMode {
  for (const arg of argv) {
    if (arg.startsWith('--only=')) {
      const value = arg.slice('--only='.length) as OnlyMode;
      if (value === 'sandbox' || value === 'live' || value === 'all') {
        return value;
      }
      throw new Error(`Invalid --only value: ${value}`);
    }
  }
  return 'all';
}

function resolveBaseUrl(
  suite: SuiteName,
  override?: string,
  fallback?: string,
): string {
  if (override?.trim()) {
    return override.trim().replace(/\/$/, '');
  }
  if (fallback) {
    return fallback.replace(/\/$/, '');
  }
  return suite === 'sandbox'
    ? 'https://sandbox.api.lomi.africa'
    : 'https://api.lomi.africa';
}

async function main(): Promise<void> {
  const only = parseArgs(process.argv.slice(2));
  const runId = randomUUID();
  const ctx: SuiteContext = { runId };

  const testKey = process.env.LOMI_TEST_KEY?.trim();
  const liveKey = process.env.LOMI_LIVE_KEY?.trim();
  const sandboxUrl = process.env.SANDBOX_API_URL?.trim();
  const liveUrl = process.env.LIVE_API_URL?.trim();

  const suites: SuiteResult[] = [];

  const shouldRunSandbox = only === 'all' || only === 'sandbox';
  const shouldRunLive = only === 'all' || only === 'live';

  if (shouldRunSandbox) {
    if (!testKey) {
      console.error(
        'LOMI_TEST_KEY is required for sandbox synthetics (lomi_sk_test_...).',
      );
      process.exit(1);
    }
    suites.push(
      await runSuite(
        'sandbox',
        resolveBaseUrl('sandbox', sandboxUrl),
        testKey,
        createSandboxChecks(),
        ctx,
      ),
    );
  }

  if (shouldRunLive) {
    if (!liveKey) {
      console.error(
        'LOMI_LIVE_KEY is required for live synthetics (lomi_sk_live_...).',
      );
      process.exit(1);
    }
    suites.push(
      await runSuite(
        'live',
        resolveBaseUrl('live', liveUrl),
        liveKey,
        createLiveChecks(),
        { runId },
      ),
    );
  }

  if (suites.length === 0) {
    console.error('No suites selected to run.');
    process.exit(1);
  }

  const report = buildReport(suites);
  printReport(report);
  writeReport(report);

  if (!report.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
