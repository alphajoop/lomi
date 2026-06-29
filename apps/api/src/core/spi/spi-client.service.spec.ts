import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SpiClientService } from './spi-client.service';
import { SpiTokenService } from './spi-token.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { loadSpiPlatformConfig } from './spi-config';
import { getSpiMtlsDispatcher } from './spi-transport';
import { createPiSpiSdk, isPiSpiAuthError } from './spi-sdk.loader';

jest.mock('./spi-config', () => ({
  loadSpiPlatformConfig: jest.fn(() => ({
    baseUrl: 'https://sandbox.api.pi-bceao.com/piz/v1',
    tokenUrl: 'https://sandbox.api.pi-bceao.com/oauth/token',
    clientId: 'client',
    clientSecret: 'secret',
  })),
}));

jest.mock('./spi-transport', () => ({
  getSpiMtlsDispatcher: jest.fn(() => undefined),
}));

jest.mock('./spi-sdk.loader', () => ({
  createPiSpiSdk: jest.fn(),
  isPiSpiAuthError: jest.fn(),
}));

describe('SpiClientService', () => {
  let service: SpiClientService;
  const rpcMock = jest.fn();
  const tokenServiceMock = {
    getAccessToken: jest.fn().mockResolvedValue('platform-token'),
    invalidate: jest.fn(),
  };
  const createPiSpiSdkMock = createPiSpiSdk as jest.Mock;
  const isPiSpiAuthErrorMock = isPiSpiAuthError as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    tokenServiceMock.getAccessToken.mockResolvedValue('platform-token');
    isPiSpiAuthErrorMock.mockImplementation(async (error: unknown) => {
      return (
        error instanceof Error &&
        error.name === 'PiSpiAuthError'
      );
    });
    createPiSpiSdkMock.mockResolvedValue({
      demandesPaiement: { create: jest.fn() },
      alias: { create: jest.fn() },
      qr: { payload: jest.fn() },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpiClientService,
        { provide: SupabaseService, useValue: { rpc: rpcMock } },
        { provide: SpiTokenService, useValue: tokenServiceMock },
      ],
    }).compile();

    service = module.get(SpiClientService);
  });

  it('builds SDK with platform token and org connection check', async () => {
    rpcMock.mockResolvedValueOnce({ data: {}, error: null });

    const sdk = await service.getSdk('org-1');

    expect(tokenServiceMock.getAccessToken).toHaveBeenCalled();
    expect(loadSpiPlatformConfig).toHaveBeenCalled();
    expect(getSpiMtlsDispatcher).toHaveBeenCalled();
    expect(createPiSpiSdkMock).toHaveBeenCalled();
    expect(sdk).toBeDefined();
  });

  it('rejects when org SPI is not connected', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await expect(service.getSdk('org-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('retries once after auth error', async () => {
    rpcMock.mockResolvedValue({ data: {}, error: null });

    class PiSpiAuthError extends Error {
      name = 'PiSpiAuthError';
    }

    let attempts = 0;
    await expect(
      service.executeWithSdk('org-1', async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new PiSpiAuthError('expired');
        }
        return 'ok';
      }),
    ).resolves.toBe('ok');

    expect(tokenServiceMock.invalidate).toHaveBeenCalledTimes(1);
    expect(attempts).toBe(2);
  });
});
