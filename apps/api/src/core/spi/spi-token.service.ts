import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  assertSpiPlatformCredentialsConfigured,
  loadSpiPlatformConfig,
  type SpiPlatformConfig,
} from './spi-config';
import { getSpiMtlsDispatcher } from './spi-transport';

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

type OAuthTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

const REFRESH_SKEW_MS = 60_000;

@Injectable()
export class SpiTokenService {
  private readonly logger = new Logger(SpiTokenService.name);
  private cache: TokenCache | null = null;
  private inflight: Promise<string> | null = null;

  invalidate(): void {
    this.cache = null;
    this.inflight = null;
  }

  async getAccessToken(): Promise<string> {
    const config = loadSpiPlatformConfig();
    assertSpiPlatformCredentialsConfigured(config);

    if (this.cache && Date.now() < this.cache.expiresAtMs - REFRESH_SKEW_MS) {
      return this.cache.accessToken;
    }

    if (!this.inflight) {
      this.inflight = this.fetchAccessToken(config).finally(() => {
        this.inflight = null;
      });
    }

    return this.inflight;
  }

  private async fetchAccessToken(config: SpiPlatformConfig): Promise<string> {
    const dispatcher = getSpiMtlsDispatcher();
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const init: RequestInit & { dispatcher?: unknown } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    };

    if (dispatcher) {
      init.dispatcher = dispatcher;
    }

    let response: Response;
    try {
      response = await fetch(config.tokenUrl, init);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'SPI token request failed';
      this.logger.error(`SPI OAuth token request failed: ${message}`);
      throw new InternalServerErrorException(
        'Failed to obtain PI-SPI access token',
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `SPI OAuth token error ${response.status}: ${errorText.slice(0, 500)}`,
      );
      throw new InternalServerErrorException(
        'PI-SPI token endpoint returned an error',
      );
    }

    const payload = (await response.json()) as OAuthTokenResponse;
    const accessToken = payload.access_token?.trim();

    if (!accessToken) {
      throw new InternalServerErrorException(
        'PI-SPI token endpoint response missing access_token',
      );
    }

    const expiresInSec =
      typeof payload.expires_in === 'number' && payload.expires_in > 0
        ? payload.expires_in
        : 3600;

    this.cache = {
      accessToken,
      expiresAtMs: Date.now() + expiresInSec * 1000,
    };

    this.logger.log('PI-SPI access token refreshed');
    return accessToken;
  }
}
