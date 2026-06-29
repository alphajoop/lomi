import { Agent, type Dispatcher } from 'undici';
import {
  loadSpiPlatformConfig,
  resolvePemValue,
  type SpiPlatformConfig,
} from './spi-config';

let cachedDispatcher: Dispatcher | undefined;
let cachedTlsFingerprint: string | undefined;

function tlsFingerprint(config: SpiPlatformConfig): string {
  return [
    config.clientCert ?? '',
    config.clientKey ?? '',
    config.caCert ?? '',
  ].join('|');
}

export function createSpiMtlsDispatcher(
  config: SpiPlatformConfig = loadSpiPlatformConfig(),
): Dispatcher | undefined {
  const { clientCert, clientKey, caCert } = config;

  if (!clientCert || !clientKey) {
    return undefined;
  }

  return new Agent({
    connect: {
      cert: clientCert,
      key: clientKey,
      ...(caCert ? { ca: caCert } : {}),
    },
  });
}

export function getSpiMtlsDispatcher(): Dispatcher | undefined {
  const config = loadSpiPlatformConfig();
  const fingerprint = tlsFingerprint(config);

  if (cachedDispatcher && cachedTlsFingerprint === fingerprint) {
    return cachedDispatcher;
  }

  cachedDispatcher = createSpiMtlsDispatcher(config);
  cachedTlsFingerprint = fingerprint;
  return cachedDispatcher;
}

export function resetSpiMtlsDispatcherCache(): void {
  cachedDispatcher = undefined;
  cachedTlsFingerprint = undefined;
}

export function resolvePemFromEnv(
  envValue: string | undefined,
): string | undefined {
  return resolvePemValue(envValue);
}
