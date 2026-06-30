/**
 * Per-request options (idempotency, connected account, abort).
 */

export type LomiRequestOptions = {
  /** Idempotency key for safe retries on create-style calls (`Idempotency-Key` header). */
  idempotencyKey?: string;
  /** Connected account id (`Lomi-Account` header, `acct_…`). Overrides client default. */
  account?: string;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Extra headers for this request only. */
  headers?: Record<string, string>;
};

export type LomiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type LomiClientRequestOptions = LomiRequestOptions & {
  method: LomiHttpMethod;
  url: string;
  path?: Record<string, string | number>;
  query?: Record<string, unknown>;
  body?: unknown;
};
