import { ApiClient } from './client';
import {
  analyzeResponse,
  previewResponse,
  scanForLeaks,
} from './assert';
import type {
  CheckDefinition,
  CheckResult,
  SuiteContext,
  SuiteName,
  SuiteResult,
} from './types';

function resolvePath(
  path: string | ((ctx: SuiteContext) => string),
  ctx: SuiteContext,
): string {
  return typeof path === 'function' ? path(ctx) : path;
}

function resolveBody(
  body: CheckDefinition['body'],
  ctx: SuiteContext,
): unknown {
  if (body === undefined) return undefined;
  return typeof body === 'function' ? body(ctx) : body;
}

function resolveHeaders(
  headers: CheckDefinition['headers'],
  ctx: SuiteContext,
): Record<string, string> | undefined {
  if (headers === undefined) return undefined;
  return typeof headers === 'function' ? headers(ctx) : headers;
}

function resolveExpected(
  expectStatus: CheckDefinition['expectStatus'],
  ctx: SuiteContext,
): number | number[] {
  if (expectStatus === undefined) {
    return [200, 201, 202];
  }
  return typeof expectStatus === 'function' ? expectStatus(ctx) : expectStatus;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSuite(
  suite: SuiteName,
  baseUrl: string,
  apiKey: string | undefined,
  checks: CheckDefinition[],
  ctx: SuiteContext,
): Promise<SuiteResult> {
  const client = new ApiClient({ baseUrl, apiKey });
  const startedAt = new Date().toISOString();
  const suiteStart = Date.now();
  const results: CheckResult[] = [];

  for (const check of checks) {
    const path = resolvePath(check.path, ctx);

    const skipReason = check.skipIf?.(ctx) ?? null;
    if (skipReason) {
      results.push({
        suite,
        name: check.name,
        service: check.service,
        method: check.method,
        path,
        status: 'skip',
        skipReason,
        anomalies: [],
      });
      continue;
    }

    try {
      const expected = resolveExpected(check.expectStatus, ctx);
      const maxAttempts = Math.max(1, check.retry?.attempts ?? 1);
      const retryDelayMs = check.retry?.delayMs ?? 0;

      let res: Awaited<ReturnType<typeof client.request>> | undefined;
      let anomalies: ReturnType<typeof analyzeResponse> = [];

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        res = await client.request(check.method, path, {
          body: resolveBody(check.body, ctx),
          headers: resolveHeaders(check.headers, ctx),
          auth: check.auth,
        });

        anomalies = analyzeResponse(res, expected);

        if (check.validate && anomalies.length === 0) {
          const validationError = check.validate(ctx, res);
          if (validationError) {
            anomalies.push({ kind: 'validation', message: validationError });
          }
        }

        const shouldRetry =
          check.retry &&
          attempt < maxAttempts &&
          anomalies.some((a) => a.kind === 'validation');

        if (!shouldRetry) {
          break;
        }

        if (retryDelayMs > 0) {
          await sleep(retryDelayMs);
        }
      }

      if (!res) {
        throw new Error('Request did not run');
      }

      if (check.capture && anomalies.length === 0) {
        check.capture(ctx, res);
      } else if (check.capture) {
        // Still capture on expected failures (e.g. failed scenario)
        const expectedList = Array.isArray(expected) ? expected : [expected];
        if (expectedList.includes(res.status)) {
          check.capture(ctx, res);
        }
      }

      // Always scan leaks on any response body when status is error
      if (res.status >= 400) {
        for (const leak of scanForLeaks(res.data)) {
          if (!anomalies.some((a) => a.message === leak.message)) {
            anomalies.push(leak);
          }
        }
      }

      const passed = anomalies.length === 0;
      results.push({
        suite,
        name: check.name,
        service: check.service,
        method: check.method,
        path,
        status: passed ? 'pass' : 'fail',
        httpStatus: res.status,
        latencyMs: res.latencyMs,
        anomalies,
        responsePreview: passed ? undefined : previewResponse(res.data),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        suite,
        name: check.name,
        service: check.service,
        method: check.method,
        path,
        status: 'fail',
        anomalies: [
          {
            kind: 'validation',
            message: `Request threw: ${message}`,
          },
        ],
      });
    }
  }

  const finishedAt = new Date().toISOString();
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  return {
    suite,
    baseUrl,
    startedAt,
    finishedAt,
    durationMs: Date.now() - suiteStart,
    checks: results,
    passed,
    failed,
    skipped,
  };
}
