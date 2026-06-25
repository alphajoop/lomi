import { createHash } from 'node:crypto';
import { stableStringify } from './stable-json-stringify';

/** Canonical body snapshot for hashing (drops undefined via JSON). */
export function snapshotRequestBody(payload: Record<string, unknown>): string {
  return stableStringify(JSON.parse(JSON.stringify(payload)));
}

/** SHA-256 fingerprint of canonical JSON snapshot. */
export function fingerprintRequestBody(
  payload: Record<string, unknown>,
): string {
  return createHash('sha256')
    .update(snapshotRequestBody(payload))
    .digest('hex');
}

/** Normalize optional Idempotency-Key header (Stripe-style max ~255 chars). */
export function normalizeIdempotencyKey(
  header?: string | string[],
): string | null {
  const raw = Array.isArray(header) ? header[0] : header;
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (!t.length) return null;
  return t.slice(0, 255);
}

export type RequestIdempotencyContext = {
  key: string;
  bodyHash: string;
};

/** Build idempotency context from header + request body (write endpoints). */
export function resolveRequestIdempotency(
  header: string | string[] | undefined,
  body: Record<string, unknown>,
): RequestIdempotencyContext | undefined {
  const key = normalizeIdempotencyKey(header);
  if (!key) return undefined;
  return {
    key,
    bodyHash: fingerprintRequestBody(body),
  };
}
