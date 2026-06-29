/**
 * One-time script to register PI-SPI inbound webhooks with BCEAO.
 *
 * Usage (from apps/api):
 *   pnpm run spi:register-webhooks
 */
import { PiSpiSDK, WEBHOOK_EVENTS } from 'pi-spi-sdk';
import {
  assertSpiPlatformCredentialsConfigured,
  loadSpiPlatformConfig,
} from '../src/core/spi/spi-config';
import { getSpiMtlsDispatcher } from '../src/core/spi/spi-transport';
import { SpiTokenService } from '../src/core/spi/spi-token.service';

async function main(): Promise<void> {
  const config = loadSpiPlatformConfig();
  assertSpiPlatformCredentialsConfigured(config);

  const tokenService = new SpiTokenService();
  const accessToken = await tokenService.getAccessToken();
  const dispatcher = getSpiMtlsDispatcher();

  const sdk = new PiSpiSDK({
    baseUrl: config.baseUrl,
    accessToken,
    ...(dispatcher ? { dispatcher } : {}),
  });

  const callbackUrl =
    process.env.SPI_WEBHOOK_CALLBACK_URL?.trim() ??
    'https://api.lomi.africa/webhooks/spi';

  const events = [
    WEBHOOK_EVENTS.PAIEMENT_RECU,
    WEBHOOK_EVENTS.PAIEMENT_ENVOYE,
    WEBHOOK_EVENTS.PAIEMENT_REJETE,
  ];

  const created = await sdk.webhooks.create({
    callbackUrl,
    events,
  });

  console.log('PI-SPI webhook registered:', JSON.stringify(created, null, 2));
}

main().catch((error) => {
  console.error('Failed to register PI-SPI webhooks:', error);
  process.exit(1);
});
