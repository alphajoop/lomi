import {
  extractSpiRejectionCode,
  mapSpiBnplRejection,
} from './spi-bnpl-rejection.util';

describe('spi-bnpl-rejection.util', () => {
  it('maps AG03 to fallback suggestion', () => {
    const result = mapSpiBnplRejection('AG03');
    expect(result.spiRejectionCode).toBe('AG03');
    expect(result.suggestInstantPayFallback).toBe(true);
    expect(result.message).toMatch(/bank/i);
  });

  it('extracts statutRaison from SPI response', () => {
    expect(extractSpiRejectionCode(null, { statutRaison: 'BE23' })).toBe(
      'BE23',
    );
  });
});
