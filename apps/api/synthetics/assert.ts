import type { Anomaly, HttpResponse } from './types';

/** Patterns that must never appear in merchant-facing error messages. */
const LEAK_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /STRIPE_SECRET_KEY/i, label: 'Stripe secret env var name' },
  { pattern: /\bstripe\b.*\bnot configured\b/i, label: 'Stripe configuration hint' },
  { pattern: /\bnot configured for this api\b/i, label: 'API instance config hint' },
  { pattern: /\bset\s+STRIPE/i, label: 'Stripe setup instruction' },
  { pattern: /\bsupabase\b/i, label: 'Supabase reference' },
  { pattern: /\bDB_SECRET_KEY\b/i, label: 'DB secret key name' },
  { pattern: /\bWAVE_API_KEY\b/i, label: 'Wave API key name' },
  { pattern: /\benvironment variable\b/i, label: 'Environment variable hint' },
  { pattern: /\bat\s+\w+\s+\(/, label: 'Stack trace fragment' },
  { pattern: /Cannot read propert/i, label: 'Runtime error leak' },
  { pattern: /undefined is not/i, label: 'Runtime error leak' },
];

function collectErrorStrings(data: unknown): string[] {
  const out: string[] = [];
  if (data == null) return out;

  if (typeof data === 'string') {
    out.push(data);
    return out;
  }

  if (typeof data !== 'object') return out;

  const obj = data as Record<string, unknown>;

  if (typeof obj.message === 'string') out.push(obj.message);
  if (typeof obj.error === 'string') out.push(obj.error);

  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>;
    if (typeof err.message === 'string') out.push(err.message);
    if (typeof err.code === 'string') out.push(err.code);
  }

  if (Array.isArray(obj.message)) {
    for (const m of obj.message) {
      if (typeof m === 'string') out.push(m);
    }
  }

  return out;
}

export function scanForLeaks(data: unknown): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const texts = collectErrorStrings(data);

  for (const text of texts) {
    for (const { pattern, label } of LEAK_PATTERNS) {
      if (pattern.test(text)) {
        anomalies.push({
          kind: 'leak',
          message: `Internal detail leaked in error message (${label}): ${truncate(text, 120)}`,
        });
      }
    }
  }

  return anomalies;
}

export function analyzeStatus(
  res: HttpResponse,
  expected: number | number[],
): Anomaly[] {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (allowed.includes(res.status)) {
    return [];
  }
  return [
    {
      kind: 'status',
      message: `Expected HTTP ${allowed.join(' or ')}, got ${res.status}`,
    },
  ];
}

export function analyzeServiceUnavailable(res: HttpResponse): Anomaly[] {
  if (res.status !== 503) return [];

  const texts = collectErrorStrings(res.data);
  const code = texts.find((t) => t === 'service_unavailable');
  const hasCode =
    res.data &&
    typeof res.data === 'object' &&
    (res.data as Record<string, unknown>).error &&
    typeof (res.data as Record<string, unknown>).error === 'object' &&
    ((res.data as Record<string, unknown>).error as Record<string, unknown>)
      .code === 'service_unavailable';

  if (code || hasCode || res.status === 503) {
    const msg =
      texts.find((t) => t !== 'service_unavailable') ??
      JSON.stringify(res.data).slice(0, 200);
    return [
      {
        kind: 'service_unavailable',
        message: `Service unavailable (503): ${truncate(msg, 160)}`,
      },
    ];
  }
  return [];
}

export function analyzeResponse(
  res: HttpResponse,
  expected: number | number[],
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  anomalies.push(...analyzeStatus(res, expected));

  if (res.status >= 500 || res.status === 503) {
    anomalies.push(...analyzeServiceUnavailable(res));
  }

  if (res.status >= 400) {
    anomalies.push(...scanForLeaks(res.data));
  }

  return anomalies;
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export function previewResponse(data: unknown, max = 280): string {
  try {
    const text = JSON.stringify(data);
    return truncate(text, max);
  } catch {
    return String(data);
  }
}

/** Unwrap `{ success, data }` envelopes common in lomi API responses. */
export function unwrapData(body: unknown): unknown {
  if (body && typeof body === 'object' && 'data' in body) {
    const wrapped = body as { data: unknown };
    if (wrapped.data !== undefined && wrapped.data !== null) {
      return wrapped.data;
    }
  }
  return body;
}

export function pickString(
  body: unknown,
  ...keys: string[]
): string | undefined {
  const data = unwrapData(body);
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return undefined;
}
