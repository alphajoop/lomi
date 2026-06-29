import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PiSpiAuthError } from 'pi-spi-sdk';
import { SpiClientService } from './spi-client.service';
import { SpiTokenService } from './spi-token.service';
import { SupabaseService } from '../../utils/supabase/supabase.service';
import { loadSpiPlatformConfig } from './spi-config';
import { getSpiMtlsDispatcher } from './spi-transport';

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

jest.mock('pi-spi-sdk', () => {
  const instances: Array<{ demandesPaiement: { create: jest.Mock } }> = [];
  return {
    PiSpiSDK: jest.fn().mockImplementation(() => {
      const instance = {
        demandesPaiement: { create: jest.fn() },
        alias: { create: jest.fn() },
        qr: { payload: jest.fn() },
      };
      instances.push(instance);
      return instance;
    }),
    PiSpiAuthError: class PiSpiAuthError extends Error {
      statusCode = 401;
    },
    AliasType: { SHID: 'SHID' },
    __instances: instances,
  };
});

describe('SpiClientService', () => {
  let service: SpiClientService;
  const rpcMock = jest.fn();
  const tokenServiceMock = {
    getAccessToken: jest.fn().mockResolvedValue('platform-token'),
    invalidate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    tokenServiceMock.getAccessToken.mockResolvedValue('platform-token');

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

    let attempts = 0;
    await expect(
      service.executeWithSdk('org-1', async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new PiSpiAuthError('expired', 401, 'Unauthorized');
        }
        return 'ok';
      }),
    ).resolves.toBe('ok');

    expect(tokenServiceMock.invalidate).toHaveBeenCalledTimes(1);
    expect(attempts).toBe(2);
  });
});
