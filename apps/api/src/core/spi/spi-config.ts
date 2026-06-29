import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';

export const SPI_SANDBOX_BASE_URL = 'https://sandbox.api.pi-bceao.com/piz/v1';

export type SpiPlatformConfig = {
  baseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  clientCert?: string;
  clientKey?: string;
  caCert?: string;
};

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

/** Resolve PEM from inline text, base64-encoded PEM, or filesystem path. */
export function resolvePemValue(raw?: string): string | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  const trimmed = raw.trim();

  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }

  if (!trimmed.includes('-----BEGIN')) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN')) {
        return decoded;
      }
    } catch {
      // fall through to path handling
    }
  }

  const candidatePath = isAbsolute(trimmed)
    ? trimmed
    : resolve(process.cwd(), trimmed);

  if (existsSync(candidatePath)) {
    return readFileSync(candidatePath, 'utf8');
  }

  return trimmed.startsWith('-----BEGIN') ? trimmed : undefined;
}

function requireProductionEnv(name: string, value?: string): string {
  if (!value?.trim()) {
    throw new Error(
      `${name} is required when NODE_ENV=production for PI-SPI connectivity`,
    );
  }
  return value.trim();
}

export function loadSpiPlatformConfig(): SpiPlatformConfig {
  const baseUrl = process.env.SPI_BASE_URL?.trim() ?? '';
  const tokenUrl = process.env.SPI_TOKEN_URL?.trim() ?? '';
  const clientId = process.env.SPI_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.SPI_CLIENT_SECRET?.trim() ?? '';

  if (isProduction()) {
    const productionBaseUrl = requireProductionEnv('SPI_BASE_URL', baseUrl);
    if (
      productionBaseUrl.includes('sandbox') ||
      productionBaseUrl === SPI_SANDBOX_BASE_URL
    ) {
      throw new Error(
        'SPI_BASE_URL must point to the production PI-SPI API in production (sandbox URL is not allowed)',
      );
    }

    return {
      baseUrl: productionBaseUrl,
      tokenUrl: requireProductionEnv('SPI_TOKEN_URL', tokenUrl),
      clientId: requireProductionEnv('SPI_CLIENT_ID', clientId),
      clientSecret: requireProductionEnv('SPI_CLIENT_SECRET', clientSecret),
      clientCert: resolvePemValue(process.env.SPI_CLIENT_CERT),
      clientKey: resolvePemValue(process.env.SPI_CLIENT_KEY),
      caCert: resolvePemValue(process.env.SPI_CA_CERT),
    };
  }

  return {
    baseUrl: baseUrl || SPI_SANDBOX_BASE_URL,
    tokenUrl:
      tokenUrl ||
      `${(baseUrl || SPI_SANDBOX_BASE_URL).replace(/\/piz\/v1\/?$/, '')}/oauth/token`,
    clientId,
    clientSecret,
    clientCert: resolvePemValue(process.env.SPI_CLIENT_CERT),
    clientKey: resolvePemValue(process.env.SPI_CLIENT_KEY),
    caCert: resolvePemValue(process.env.SPI_CA_CERT),
  };
}

export function assertSpiPlatformCredentialsConfigured(
  config: SpiPlatformConfig,
): void {
  if (!config.clientId || !config.clientSecret || !config.tokenUrl) {
    throw new Error(
      'SPI_CLIENT_ID, SPI_CLIENT_SECRET, and SPI_TOKEN_URL must be configured for PI-SPI API calls',
    );
  }
}

export function isSpiWebhookSecretRequired(): boolean {
  return isProduction();
}
