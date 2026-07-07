import { GIM_UAT_PAY_BY_CARD_URL, loadGimPlatformConfig } from './gim-config';

describe('gim-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to UAT PayByCard URL in development', () => {
    delete process.env.GIM_BASE_URL;
    process.env.NODE_ENV = 'development';

    const config = loadGimPlatformConfig();
    expect(config.payByCardUrl).toBe(GIM_UAT_PAY_BY_CARD_URL);
    expect(config.amountMultiplier).toBe(100);
  });

  it('throws in production when UAT URL is configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOMI_API_ENV;
    process.env.GIM_BASE_URL = GIM_UAT_PAY_BY_CARD_URL;
    process.env.GIM_MERCHANT_ID = '13416315350';
    process.env.GIM_TERMINAL_ID = '17406438';
    process.env.GIM_SECRET_KEY_HEX = 'abc';
    process.env.GIM_RETURN_URL = 'https://api.lomi.africa/payments/gim/return';

    expect(() => loadGimPlatformConfig()).toThrow(/UAT/);
  });

  it('allows UAT URL on sandbox production hosts', () => {
    process.env.NODE_ENV = 'production';
    process.env.LOMI_API_ENV = 'sandbox';
    delete process.env.GIM_BASE_URL;

    const config = loadGimPlatformConfig();
    expect(config.payByCardUrl).toBe(GIM_UAT_PAY_BY_CARD_URL);
  });

  it('reads custom amount multiplier from env', () => {
    process.env.NODE_ENV = 'development';
    process.env.GIM_AMOUNT_MULTIPLIER = '1';

    const config = loadGimPlatformConfig();
    expect(config.amountMultiplier).toBe(1);
  });
});
