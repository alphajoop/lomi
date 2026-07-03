import { ServiceUnavailableException } from '@nestjs/common';

export type PiSpiSdkConfig = {
  baseUrl: string;
  accessToken: string;
  dispatcher?: unknown;
};

/** Minimal SDK surface referenced by SpiClientService and SPI feature services. */
export type PiSpiSDK = {
  alias: {
    create: (input: {
      compte: string;
      type: string;
    }) => Promise<{ cle?: string }>;
  };
  comptes: {
    getAccount: (accountNumber: string) => Promise<Record<string, unknown>>;
  };
  demandesPaiement: {
    create: (
      input: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };
  demandesPaiementEnMasse: {
    create: (
      input: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };
  paiements: {
    create: (
      input: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };
  qr: {
    payload: (input: Record<string, unknown>) => string;
    svg: (
      input: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => Promise<string>;
  };
  webhooks: {
    create: (
      input: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };
};

const SPI_STANDBY_MESSAGE =
  'PI-SPI is not operational yet. Install and configure pi-spi-sdk when ready.';

export async function createPiSpiSdk(
  config: PiSpiSdkConfig,
): Promise<PiSpiSDK> {
  try {
    const { PiSpiSDK } = await import('pi-spi-sdk');
    const sdkConfig = {
      baseUrl: config.baseUrl,
      accessToken: config.accessToken,
      ...(config.dispatcher ? { dispatcher: config.dispatcher } : {}),
    };
    return new PiSpiSDK(
      sdkConfig as ConstructorParameters<typeof PiSpiSDK>[0],
    ) as unknown as PiSpiSDK;
  } catch {
    throw new ServiceUnavailableException(SPI_STANDBY_MESSAGE);
  }
}

export async function isPiSpiAuthError(error: unknown): Promise<boolean> {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    name?: string;
    status?: number;
    statusCode?: number;
  };

  if (candidate.name === 'PiSpiAuthError') {
    return true;
  }

  try {
    const { PiSpiAuthError } = await import('pi-spi-sdk');
    if (error instanceof PiSpiAuthError) {
      return true;
    }
  } catch {
    // SDK not installed — fall through to status checks
  }

  return candidate.status === 401 || candidate.statusCode === 401;
}
