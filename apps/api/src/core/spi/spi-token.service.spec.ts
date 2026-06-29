import { InternalServerErrorException } from '@nestjs/common';
import { SpiTokenService } from './spi-token.service';
import { getSpiMtlsDispatcher } from './spi-transport';

jest.mock('./spi-config', () => ({
  loadSpiPlatformConfig: jest.fn(() => ({
    baseUrl: 'https://sandbox.api.pi-bceao.com/piz/v1',
    tokenUrl: 'https://token.example/oauth/token',
    clientId: 'client-id',
    clientSecret: 'client-secret',
  })),
  assertSpiPlatformCredentialsConfigured: jest.fn(),
}));

jest.mock('./spi-transport', () => ({
  getSpiMtlsDispatcher: jest.fn(() => undefined),
}));

describe('SpiTokenService', () => {
  const originalFetch = global.fetch;
  let service: SpiTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SpiTokenService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches and caches access token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token-1', expires_in: 3600 }),
    });

    const first = await service.getAccessToken();
    const second = await service.getAccessToken();

    expect(first).toBe('token-1');
    expect(second).toBe('token-1');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getSpiMtlsDispatcher).toHaveBeenCalled();
  });

  it('refetches after invalidate', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-1', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-2', expires_in: 3600 }),
      });

    await service.getAccessToken();
    service.invalidate();
    const token = await service.getAccessToken();

    expect(token).toBe('token-2');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws when token endpoint fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });

    await expect(service.getAccessToken()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
