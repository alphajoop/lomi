import {
  buildDateTimeLocalTrxn,
  classifyActionCode,
  gateXofAmount,
  maskPan,
  resetDateTimeLocalTrxnSequenceForTests,
  toExpiryYyMm,
  toGimAmount,
} from './gim.utils';

describe('gim.utils', () => {
  beforeEach(() => {
    resetDateTimeLocalTrxnSequenceForTests();
  });

  describe('gateXofAmount', () => {
    it('accepts positive integers', () => {
      expect(gateXofAmount(5000)).toBe(5000);
    });

    it('rejects decimals', () => {
      expect(() => gateXofAmount(100.5)).toThrow(/whole number/);
    });

    it('rejects non-positive amounts', () => {
      expect(() => gateXofAmount(0)).toThrow(/greater than zero/);
    });
  });

  describe('toGimAmount', () => {
    it('applies multiplier', () => {
      expect(toGimAmount(30, 100)).toBe(3000);
    });

    it('rejects amounts exceeding digit limit', () => {
      expect(() => toGimAmount(10 ** 14, 100)).toThrow(/15 digits/);
    });
  });

  describe('maskPan', () => {
    it('masks to first6/last4', () => {
      expect(maskPan('4221941234569109')).toBe('422194******9109');
    });
  });

  describe('toExpiryYyMm', () => {
    it('parses MM/YY', () => {
      expect(toExpiryYyMm('06/25')).toBe('2506');
    });

    it('accepts YYMM', () => {
      expect(toExpiryYyMm('2506')).toBe('2506');
    });
  });

  describe('buildDateTimeLocalTrxn', () => {
    it('returns 12-digit YYMMDDHHMMSS by default', () => {
      const value = buildDateTimeLocalTrxn(new Date('2025-06-15T14:23:45Z'));
      expect(value).toHaveLength(12);
      expect(value).toMatch(/^\d{12}$/);
    });

    it('returns 15 digits when configured', () => {
      const value = buildDateTimeLocalTrxn(
        new Date('2025-06-15T14:23:45Z'),
        15,
      );
      expect(value).toHaveLength(15);
    });
  });

  describe('classifyActionCode', () => {
    it('classifies approved codes', () => {
      expect(classifyActionCode('000')).toBe('approved');
      expect(classifyActionCode('001')).toBe('approved');
    });

    it('classifies user declines as final', () => {
      expect(classifyActionCode('116')).toBe('declined_final');
      expect(classifyActionCode('101')).toBe('declined_final');
    });

    it('classifies system errors for rail fallback', () => {
      expect(classifyActionCode('909')).toBe('retry_other_rail');
      expect(classifyActionCode('880')).toBe('retry_other_rail');
      expect(classifyActionCode(null, true)).toBe('retry_other_rail');
    });
  });
});
