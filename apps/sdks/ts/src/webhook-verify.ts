/**
 * Webhook signature verification (HMAC SHA-256).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify an incoming lomi. webhook signature.
 *
 * @param rawBody - Raw request body (string or Buffer)
 * @param signature - Value of the `X-Lomi-Signature` header
 * @param secret - Your webhook signing secret from the dashboard
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const payload = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8')
    : rawBody;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}
