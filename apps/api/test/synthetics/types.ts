export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type SuiteName = 'sandbox' | 'live';

export interface HttpResponse {
  status: number;
  data: unknown;
  latencyMs: number;
  headers: Record<string, string>;
}

export interface SuiteContext {
  runId: string;
  /** IDs captured from prior checks for chaining */
  customerId?: string;
  productId?: string;
  transactionId?: string;
  pendingTransactionId?: string;
  checkoutSessionId?: string;
  paymentLinkId?: string;
  paymentRequestId?: string;
  refundId?: string;
  couponId?: string;
  meterName?: string;
  meterId?: string;
  usageEventId?: string;
  usageQuantity?: number;
  usageProductId?: string;
  usageMeterCode?: string;
  usageSubscriptionId?: string;
  usageSubQuantity?: number;
  usageSubEventId?: string;
  paymentWebhookId?: string;
  webhookId?: string;
  webhookSecret?: string;
  webhookDeliveryLogId?: string;
  apiLogEntryId?: string;
  correlatedRequestId?: string;
  [key: string]: unknown;
}

export interface CheckDefinition {
  name: string;
  service: string;
  method: HttpMethod;
  /** Path or builder from context */
  path: string | ((ctx: SuiteContext) => string);
  body?: unknown | ((ctx: SuiteContext) => unknown);
  headers?:
    Record<string, string> | ((ctx: SuiteContext) => Record<string, string>);
  /** When false, no X-API-KEY header (health probes). Default true. */
  auth?: boolean;
  expectStatus?: number | number[] | ((ctx: SuiteContext) => number | number[]);
  /** Custom validation; return error message or null if ok */
  validate?: (ctx: SuiteContext, res: HttpResponse) => string | null;
  /** Store IDs from response into context */
  capture?: (ctx: SuiteContext, res: HttpResponse) => void;
  /** Return skip reason to skip this check */
  skipIf?: (ctx: SuiteContext) => string | null;
  /** Re-run the HTTP request when validate fails (e.g. async log indexing). */
  retry?: { attempts: number; delayMs: number };
}

export interface Anomaly {
  kind: 'status' | 'leak' | 'validation' | 'service_unavailable';
  message: string;
}

export interface CheckResult {
  suite: SuiteName;
  name: string;
  service: string;
  method: HttpMethod;
  path: string;
  status: 'pass' | 'fail' | 'skip';
  httpStatus?: number;
  latencyMs?: number;
  skipReason?: string;
  anomalies: Anomaly[];
  responsePreview?: string;
}

export interface SuiteResult {
  suite: SuiteName;
  baseUrl: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  checks: CheckResult[];
  passed: number;
  failed: number;
  skipped: number;
}

export interface RunReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  suites: SuiteResult[];
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  ok: boolean;
}
