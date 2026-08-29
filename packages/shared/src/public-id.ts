/** Prefixed public ids (org_FJKND44523FJKN). UUID stays the primary key. */

export const PUBLIC_ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const PUBLIC_ID_BODY_LENGTH = 14;

export const PUBLIC_ID_PREFIXES = {
  organization: "org_",
  merchant: "merch_",
  customer: "cus_",
  product: "prod_",
  price: "price_",
  paymentLink: "plink_",
  invoice: "inv_",
  checkoutSession: "cs_",
  transaction: "txn_",
  subscription: "sub_",
  refund: "re_",
  payout: "po_",
  paymentRequest: "req_",
  coupon: "coup_",
  webhook: "we_",
  dispute: "dp_",
  meter: "mtr_",
  bookableService: "svc_",
} as const;

export type PublicIdKind = keyof typeof PUBLIC_ID_PREFIXES;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PREFIX_VALUES = new Set<string>(Object.values(PUBLIC_ID_PREFIXES));

export function normalizePublicId(raw: string): string {
  return raw.trim().replace(/[\s-]/g, "").toUpperCase();
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function isPublicIdPrefix(prefix: string): boolean {
  return PREFIX_VALUES.has(prefix);
}

export function isPublicId(value: string, prefix?: string): boolean {
  const normalized = normalizePublicId(value);
  const expectedPrefix = prefix ? prefix.toUpperCase() : null;
  if (expectedPrefix && !normalized.startsWith(expectedPrefix)) {
    return false;
  }

  const matchedPrefix = [...PREFIX_VALUES].find((item) =>
    normalized.startsWith(item.toUpperCase()),
  );
  if (!matchedPrefix) return false;

  const body = normalized.slice(matchedPrefix.length);
  if (body.length !== PUBLIC_ID_BODY_LENGTH) return false;
  for (const ch of body) {
    if (!PUBLIC_ID_ALPHABET.includes(ch)) return false;
  }
  return true;
}

export function publicIdPrefix(value: string): string | null {
  const normalized = normalizePublicId(value);
  const matched = [...PREFIX_VALUES].find((item) =>
    normalized.startsWith(item.toUpperCase()),
  );
  return matched ?? null;
}

export function formatPublicId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isUuid(trimmed)) return trimmed;
  return normalizePublicId(trimmed);
}

export function publicIdsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (!left || !right) return false;
  if (isUuid(left) && isUuid(right)) {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }
  return normalizePublicId(left) === normalizePublicId(right);
}
