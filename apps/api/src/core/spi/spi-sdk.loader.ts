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
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  demandesPaiementEnMasse: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  paiements: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  qr: {
    payload: (input: Record<string, unknown>) => Promise<string>;
  };
  webhooks: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
};

const SPI_STANDBY_MESSAGE =
  'PI-SPI is not operational yet. Install and configure pi-spi-sdk when ready.';

export async function createPiSpiSdk(
  _config: PiSpiSdkConfig,
): Promise<PiSpiSDK> {
  throw new ServiceUnavailableException(SPI_STANDBY_MESSAGE);
}

export async function isPiSpiAuthError(error: unknown): Promise<boolean> {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { name?: string; status?: number; statusCode?: number };
  if (candidate.name === 'PiSpiAuthError') {
    return true;
  }

  return candidate.status === 401 || candidate.statusCode === 401;
}
