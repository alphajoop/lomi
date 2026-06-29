import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';

/** Shared core: sort names asc, join name=value with &, HMAC-SHA256, hex uppercase. */
export function gimSecureHash(
  fields: Record<string, string>,
  secretKeyHex: string,
): string {
  const key = Buffer.from(secretKeyHex, 'hex');
  const message = Object.keys(fields)
    .sort()
    .map((name) => `${name}=${fields[name]}`)
    .join('&');
  return createHmac('sha256', key)
    .update(message, 'utf8')
    .digest('hex')
    .toUpperCase();
}

/** Appendix A — request signing (DateTimeLocalTrxn, MerchantId, TerminalId). */
export function signGimRequest(
  params: {
    DateTimeLocalTrxn: string;
    MerchantId: string;
    TerminalId: string;
  },
  secretKeyHex: string,
): string {
  return gimSecureHash(
    {
      DateTimeLocalTrxn: params.DateTimeLocalTrxn,
      MerchantId: params.MerchantId,
      TerminalId: params.TerminalId,
    },
    secretKeyHex,
  );
}

/** Appendix C — return-URL verification. Pass ALL query params except SecureHash. */
export function verifyGimReturn(
  query: Record<string, string>,
  receivedSecureHash: string,
  secretKeyHex: string,
): boolean {
  const { SecureHash: _ignored, ...rest } = query;
  const expected = gimSecureHash(rest, secretKeyHex);
  const a = Buffer.from(expected);
  const b = Buffer.from((receivedSecureHash || '').toUpperCase());
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

@Injectable()
export class GimHmacService {
  signRequest(
    params: {
      DateTimeLocalTrxn: string;
      MerchantId: string;
      TerminalId: string;
    },
    secretKeyHex: string,
  ): string {
    return signGimRequest(params, secretKeyHex);
  }

  verifyReturn(
    query: Record<string, string>,
    receivedSecureHash: string,
    secretKeyHex: string,
  ): boolean {
    return verifyGimReturn(query, receivedSecureHash, secretKeyHex);
  }
}
