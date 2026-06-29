import type { PiSpiSDK } from 'pi-spi-sdk';
import type { PiSpiConfig } from 'pi-spi-sdk';

type PiSpiSdkModule = typeof import('pi-spi-sdk');

let modulePromise: Promise<PiSpiSdkModule> | null = null;

async function loadPiSpiSdkModule(): Promise<PiSpiSdkModule> {
  if (!modulePromise) {
    modulePromise = import('pi-spi-sdk');
  }
  return modulePromise;
}

export async function createPiSpiSdk(config: PiSpiConfig): Promise<PiSpiSDK> {
  const { PiSpiSDK } = await loadPiSpiSdkModule();
  return new PiSpiSDK(config);
}

export async function isPiSpiAuthError(error: unknown): Promise<boolean> {
  const { PiSpiAuthError } = await loadPiSpiSdkModule();
  return error instanceof PiSpiAuthError;
}
