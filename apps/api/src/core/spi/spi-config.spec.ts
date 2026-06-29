import { resolvePemValue, loadSpiPlatformConfig, SPI_SANDBOX_BASE_URL } from './spi-config';
import { createSpiMtlsDispatcher } from './spi-transport';

describe('spi-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to sandbox base URL in development', () => {
    delete process.env.SPI_BASE_URL;
    process.env.NODE_ENV = 'development';

    const config = loadSpiPlatformConfig();
    expect(config.baseUrl).toBe(SPI_SANDBOX_BASE_URL);
  });

  it('throws in production when sandbox URL is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.SPI_BASE_URL = SPI_SANDBOX_BASE_URL;
    process.env.SPI_TOKEN_URL = 'https://prod.example/token';
    process.env.SPI_CLIENT_ID = 'id';
    process.env.SPI_CLIENT_SECRET = 'secret';

    expect(() => loadSpiPlatformConfig()).toThrow(/sandbox/);
  });

  it('parses inline PEM values', () => {
    const pem = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
    expect(resolvePemValue(pem)).toBe(pem);
  });
});

describe('spi-transport', () => {
  it('returns undefined without client cert/key', () => {
    expect(
      createSpiMtlsDispatcher({
        baseUrl: SPI_SANDBOX_BASE_URL,
        tokenUrl: 'https://token',
        clientId: 'id',
        clientSecret: 'secret',
      }),
    ).toBeUndefined();
  });

  it('creates dispatcher when cert and key are present', () => {
    const dispatcher = createSpiMtlsDispatcher({
      baseUrl: SPI_SANDBOX_BASE_URL,
      tokenUrl: 'https://token',
      clientId: 'id',
      clientSecret: 'secret',
      clientCert: '-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----',
      clientKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    });

    expect(dispatcher).toBeDefined();
  });
});
