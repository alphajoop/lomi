import {
  analyzeResponse,
  scanForLeaks,
  unwrapData,
} from './assert';

describe('synthetics assert', () => {
  it('flags Stripe secret env leak', () => {
    const leaks = scanForLeaks({
      error: {
        code: 'service_unavailable',
        message: 'Stripe test mode is not configured (set STRIPE_SECRET_KEY_TEST)',
      },
    });
    expect(leaks.length).toBeGreaterThan(0);
    expect(leaks.some((l) => l.kind === 'leak')).toBe(true);
  });

  it('allows sanitized merchant-facing message', () => {
    const leaks = scanForLeaks({
      error: {
        code: 'service_unavailable',
        message:
          'Card payments are temporarily unavailable. Please use another payment method or try again later.',
      },
    });
    expect(leaks).toHaveLength(0);
  });

  it('detects unexpected status', () => {
    const anomalies = analyzeResponse(
      { status: 503, data: { error: { message: 'unavailable' } }, latencyMs: 1, headers: {} },
      [200, 201],
    );
    expect(anomalies.some((a) => a.kind === 'status')).toBe(true);
    expect(anomalies.some((a) => a.kind === 'service_unavailable')).toBe(true);
  });

  it('unwraps success envelopes', () => {
    expect(unwrapData({ success: true, data: { id: 'x' } })).toEqual({
      id: 'x',
    });
  });
});
