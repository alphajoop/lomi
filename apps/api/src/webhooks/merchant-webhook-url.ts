import { lookup as dnsLookup } from 'node:dns/promises';
import type { LookupAddress, LookupOptions } from 'node:dns';
import { isIPv4, isIPv6 } from 'node:net';
import * as https from 'node:https';
import axios, { type AxiosRequestConfig } from 'axios';

export class UnsafeWebhookUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeWebhookUrlError';
  }
}

export interface SafeMerchantWebhookTarget {
  url: string;
  hostname: string;
  port: number;
  pinnedAddresses: string[];
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
]);

function normalizeHostname(hostname: string): string {
  return hostname.replace(/\.$/, '').toLowerCase();
}

function parseIpv4Octets(ip: string): number[] | null {
  if (!isIPv4(ip)) {
    return null;
  }
  const parts = ip.split('.').map((octet) => Number(octet));
  return parts.length === 4 ? parts : null;
}

function isBlockedIpv4(ip: string): boolean {
  const octets = parseIpv4Octets(ip);
  if (!octets) {
    return false;
  }

  const [a, b] = octets;

  if (a === 127) return true; // 127.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10

  return false;
}

function expandIpv6Hextets(ip: string): number[] | null {
  const trimmed = ip.toLowerCase();
  const [head, tail] = trimmed.split('::');
  const headParts = head ? head.split(':').filter(Boolean) : [];
  const tailParts = tail ? tail.split(':').filter(Boolean) : [];
  const missing = 8 - (headParts.length + tailParts.length);
  if (missing < 0) {
    return null;
  }

  const parts = [
    ...headParts,
    ...Array.from({ length: missing }, () => '0'),
    ...tailParts,
  ];
  if (parts.length !== 8) {
    return null;
  }

  const hextets: number[] = [];
  for (const part of parts) {
    if (part.includes('.')) {
      const ipv4 = part;
      const octets = parseIpv4Octets(ipv4);
      if (!octets) {
        return null;
      }
      const [a, b, c, d] = octets;
      hextets.push((a << 8) | b, (c << 8) | d);
      continue;
    }
    hextets.push(parseInt(part, 16));
  }

  return hextets.length === 8 ? hextets : null;
}

function isBlockedIpv6(ip: string): boolean {
  if (!isIPv6(ip)) {
    return false;
  }

  const hextets = expandIpv6Hextets(ip);
  if (!hextets) {
    return true;
  }

  if (hextets.every((h) => h === 0)) {
    return true; // ::
  }
  if (hextets[7] === 1 && hextets.slice(0, 7).every((h) => h === 0)) {
    return true; // ::1
  }
  if ((hextets[0] & 0xffc0) === 0xfe80) {
    return true; // fe80::/10
  }
  if ((hextets[0] & 0xfe00) === 0xfc00 || (hextets[0] & 0xfe00) === 0xfd00) {
    return true; // fc00::/7
  }

  // IPv4-mapped IPv6
  if (
    hextets[0] === 0 &&
    hextets[1] === 0 &&
    hextets[2] === 0 &&
    hextets[3] === 0 &&
    hextets[4] === 0 &&
    hextets[5] === 0xffff
  ) {
    const mapped = `${(hextets[6] >> 8) & 0xff}.${hextets[6] & 0xff}.${(hextets[7] >> 8) & 0xff}.${hextets[7] & 0xff}`;
    return isBlockedIpv4(mapped);
  }

  return false;
}

export function isBlockedWebhookAddress(address: string): boolean {
  if (isIPv4(address)) {
    return isBlockedIpv4(address);
  }
  if (isIPv6(address)) {
    return isBlockedIpv6(address);
  }
  return true;
}

function assertAllowedHostname(hostname: string): void {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    throw new UnsafeWebhookUrlError('Webhook URL hostname is required');
  }

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    throw new UnsafeWebhookUrlError(
      'Webhook URL hostname is not allowed for outbound delivery',
    );
  }

  if (normalized.endsWith('.localhost') || normalized.endsWith('.local')) {
    throw new UnsafeWebhookUrlError(
      'Local or internal hostnames are not allowed for webhook URLs',
    );
  }

  if (isIPv4(normalized) || isIPv6(normalized)) {
    if (isBlockedWebhookAddress(normalized)) {
      throw new UnsafeWebhookUrlError(
        'Webhook URL must not target private, loopback, link-local, or metadata addresses',
      );
    }
  }
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 307, 308]);

export function isWwwApexHostnamePair(a: string, b: string): boolean {
  const left = normalizeHostname(a);
  const right = normalizeHostname(b);
  if (left === right) {
    return true;
  }
  return left === `www.${right}` || right === `www.${left}`;
}

/** Same path/query, HTTPS only — toggles www. on the hostname. */
export function getWwwApexAlternateUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = parseMerchantWebhookUrl(url);
  } catch {
    return null;
  }

  const host = normalizeHostname(parsed.hostname);
  parsed.hostname = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  return parsed.toString();
}

/** Accept redirect targets that only swap apex ↔ www on the same path. */
export function getSafeWwwApexRedirectUrl(
  originalUrl: string,
  location: string,
): string | null {
  let original: URL;
  let redirect: URL;
  try {
    original = parseMerchantWebhookUrl(originalUrl);
    redirect = parseMerchantWebhookUrl(
      new URL(location, originalUrl).toString(),
    );
  } catch {
    return null;
  }

  if (!isWwwApexHostnamePair(original.hostname, redirect.hostname)) {
    return null;
  }
  if (
    original.pathname !== redirect.pathname ||
    original.search !== redirect.search
  ) {
    return null;
  }

  return redirect.toString();
}

function buildWwwApexDeliveryCandidates(webhookUrl: string): string[] {
  const candidates = [webhookUrl];
  const alternate = getWwwApexAlternateUrl(webhookUrl);
  if (alternate && !candidates.includes(alternate)) {
    candidates.push(alternate);
  }
  return candidates;
}

export interface MerchantWebhookDeliveryResult {
  status: number;
  data: unknown;
  deliveredUrl: string;
  usedAlternateHost: boolean;
}

/**
 * POST a webhook payload. If the registered URL redirects apex ↔ www (common),
 * automatically retries the paired hostname once. Redirects are never followed
 * blindly — only pre-approved www/apex variants after SSRF checks.
 */
export async function deliverMerchantWebhook(
  webhookUrl: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs = 4000,
): Promise<MerchantWebhookDeliveryResult> {
  const candidates = buildWwwApexDeliveryCandidates(webhookUrl);
  let lastResponse:
    | { status: number; data: unknown; url: string; usedAlternateHost: boolean }
    | undefined;

  for (let index = 0; index < candidates.length; index++) {
    const candidateUrl = candidates[index]!;
    let target: SafeMerchantWebhookTarget;
    try {
      target = await resolveSafeMerchantWebhookTarget(candidateUrl);
    } catch {
      continue;
    }

    const response = await axios.post(target.url, body, {
      ...buildSafeMerchantWebhookAxiosConfig(target),
      headers,
      timeout: timeoutMs,
      validateStatus: () => true,
    });

    const usedAlternateHost =
      normalizeHostname(new URL(target.url).hostname) !==
      normalizeHostname(new URL(webhookUrl).hostname);

    if (response.status >= 200 && response.status < 300) {
      return {
        status: response.status,
        data: response.data,
        deliveredUrl: target.url,
        usedAlternateHost,
      };
    }

    lastResponse = {
      status: response.status,
      data: response.data,
      url: target.url,
      usedAlternateHost,
    };

    if (REDIRECT_STATUS_CODES.has(response.status)) {
      const location = response.headers?.location;
      if (typeof location === 'string') {
        const redirectTarget = getSafeWwwApexRedirectUrl(webhookUrl, location);
        if (redirectTarget && !candidates.includes(redirectTarget)) {
          candidates.push(redirectTarget);
        }
      }
      continue;
    }

    break;
  }

  if (!lastResponse) {
    throw new UnsafeWebhookUrlError(
      'Webhook URL could not be resolved for delivery',
    );
  }

  return {
    status: lastResponse.status,
    data: lastResponse.data,
    deliveredUrl: lastResponse.url,
    usedAlternateHost: lastResponse.usedAlternateHost,
  };
}

export function parseMerchantWebhookUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeWebhookUrlError('Invalid webhook URL format');
  }

  if (parsed.protocol !== 'https:') {
    throw new UnsafeWebhookUrlError('Webhook URL must use HTTPS');
  }

  if (parsed.username || parsed.password) {
    throw new UnsafeWebhookUrlError(
      'Webhook URL must not include embedded credentials',
    );
  }

  assertAllowedHostname(parsed.hostname);

  return parsed;
}

export async function resolveSafeMerchantWebhookTarget(
  url: string,
): Promise<SafeMerchantWebhookTarget> {
  const parsed = parseMerchantWebhookUrl(url);
  const hostname = normalizeHostname(parsed.hostname);
  const port = parsed.port ? Number(parsed.port) : 443;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new UnsafeWebhookUrlError('Webhook URL port is invalid');
  }

  let records: LookupAddress[];
  try {
    records = (await dnsLookup(hostname, {
      all: true,
      verbatim: true,
    })) as LookupAddress[];
  } catch {
    throw new UnsafeWebhookUrlError(
      `Webhook URL hostname could not be resolved: ${hostname}`,
    );
  }

  if (!records.length) {
    throw new UnsafeWebhookUrlError(
      `Webhook URL hostname could not be resolved: ${hostname}`,
    );
  }

  const pinnedAddresses: string[] = [];
  for (const record of records) {
    if (isBlockedWebhookAddress(record.address)) {
      throw new UnsafeWebhookUrlError(
        'Webhook URL resolves to a private, loopback, link-local, or metadata address',
      );
    }
    if (!pinnedAddresses.includes(record.address)) {
      pinnedAddresses.push(record.address);
    }
  }

  return {
    url: parsed.toString(),
    hostname,
    port,
    pinnedAddresses,
  };
}

type DnsLookupCallback = (
  err: NodeJS.ErrnoException | Error | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

function toPinnedLookupRecords(pinnedAddresses: string[]): LookupAddress[] {
  return pinnedAddresses.map((address) => ({
    address,
    family: isIPv6(address) ? 6 : 4,
  }));
}

function createPinnedLookup(
  target: SafeMerchantWebhookTarget,
): NonNullable<https.AgentOptions['lookup']> {
  const allowed = new Set(target.pinnedAddresses);
  const records = toPinnedLookupRecords(target.pinnedAddresses);

  return (
    lookupHostname: string,
    options: LookupOptions | DnsLookupCallback,
    callback?: DnsLookupCallback,
  ) => {
    let opts: LookupOptions;
    let cb: DnsLookupCallback;

    if (typeof options === 'function') {
      cb = options;
      opts = {};
    } else {
      opts = options;
      cb = callback!;
    }

    if (lookupHostname !== target.hostname) {
      cb(
        new Error(
          `Unexpected webhook hostname during delivery: ${lookupHostname}`,
        ),
        '',
      );
      return;
    }

    const first = records[0];
    if (!first || !allowed.has(first.address)) {
      cb(new Error('Pinned webhook address mismatch'), '');
      return;
    }

    // Node 20+ may request `options.all` when autoSelectFamily is enabled.
    if (opts.all) {
      cb(null, records);
      return;
    }

    cb(null, first.address, first.family);
  };
}

function createPinnedHttpsAgent(
  target: SafeMerchantWebhookTarget,
): https.Agent {
  return new https.Agent({
    lookup: createPinnedLookup(target),
  });
}

export function buildSafeMerchantWebhookAxiosConfig(
  target: SafeMerchantWebhookTarget,
): AxiosRequestConfig {
  return {
    httpsAgent: createPinnedHttpsAgent(target),
    maxRedirects: 0,
  };
}
