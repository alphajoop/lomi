import type { ManifestTool } from './manifest.js';

export type LomiHttpResult = {
  status: number;
  statusText: string;
  bodyText: string;
  contentType: string | null;
};

function serializeQueryValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function declaredHeaderInputKeys(inputSchema: Record<string, unknown>): Set<string> {
  const props = inputSchema.properties;
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return new Set();
  }
  return new Set(
    Object.keys(props as Record<string, unknown>).filter((k) =>
      k.startsWith('header_'),
    ),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchTimeoutMs(): number {
  const n = Number(process.env.LOMI_API_FETCH_TIMEOUT_MS ?? '30000');
  return Number.isFinite(n) && n > 0 ? n : 30000;
}

function fetchMaxRetries(): number {
  const n = Number(process.env.LOMI_API_FETCH_RETRIES ?? '2');
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 5) : 2;
}

export async function callLomiRest(
  tool: ManifestTool,
  args: Record<string, unknown>,
  options: {
    baseUrl: string;
    apiKey: string;
    authHeaderName?: string;
  },
): Promise<LomiHttpResult> {
  const { baseUrl, apiKey, authHeaderName = 'X-API-KEY' } = options;
  const headers: Record<string, string> = {
    [authHeaderName]: apiKey,
    Accept: 'application/json',
  };

  let path = tool.pathTemplate;
  for (const name of tool.pathParamNames) {
    const v = args[name];
    if (v === undefined || v === null) {
      throw new Error(`Missing required path parameter "${name}"`);
    }
    path = path.replace(`{${name}}`, encodeURIComponent(String(v)));
  }

  const qp = new URLSearchParams();
  for (const name of tool.queryParamNames) {
    const v = args[name];
    const s = serializeQueryValue(v);
    if (s !== undefined) qp.append(name, s);
  }

  const schema = tool.inputSchema as Record<string, unknown>;
  for (const key of declaredHeaderInputKeys(schema)) {
    const v = args[key];
    if (v === undefined || v === null) continue;
    const headerName = key.slice('header_'.length);
    headers[headerName] = String(v);
  }

  const idem = args.idempotency_key;
  if (typeof idem === 'string' && idem.length > 0) {
    headers['Idempotency-Key'] = idem;
  }

  let body: string | undefined;
  if (tool.wantsBody) {
    const b = args.body;
    if (b === undefined || b === null) {
      throw new Error('Missing required "body" object for this operation.');
    }
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(b);
  }

  const root = baseUrl.replace(/\/$/, '');
  const query = qp.toString();
  const url = `${root}${path}${query ? `?${query}` : ''}`;

  const methodLower = tool.method.toLowerCase();
  const allowRetry =
    methodLower === 'get' || methodLower === 'head';
  const maxRetries = fetchMaxRetries();
  const maxAttempts = allowRetry ? maxRetries + 1 : 1;
  const timeoutMs = fetchTimeoutMs();

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: tool.method.toUpperCase(),
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (
        allowRetry &&
        attempt < maxAttempts - 1 &&
        (res.status === 429 || res.status === 503 || res.status === 502)
      ) {
        await sleep(200 * (attempt + 1));
        continue;
      }

      const contentType = res.headers.get('content-type');
      const bodyText = await res.text();

      return {
        status: res.status,
        statusText: res.statusText,
        bodyText,
        contentType,
      };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (!allowRetry || attempt >= maxAttempts - 1) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      await sleep(200 * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError));
}

export function formatHttpResult(result: LomiHttpResult): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.bodyText) as unknown;
  } catch {
    parsed = result.bodyText;
  }

  const ok = result.status >= 200 && result.status < 300;

  const envelope: Record<string, unknown> = {
    ok,
    status: result.status,
    statusText: result.statusText,
    contentType: result.contentType,
    body: parsed,
  };

  if (!ok) {
    envelope.error = {
      kind: 'lomi_http_error',
      status: result.status,
      statusText: result.statusText,
      body: parsed,
    };
  }

  return JSON.stringify(envelope, null, 2);
}
