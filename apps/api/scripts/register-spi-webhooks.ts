/**
 * PI-SPI webhook registration lives in the pi-spi-sdk repo until SPI is operational.
 *
 * Usage (from apps/sdks/pi-spi-sdk when credentials are configured):
 *   pnpm run register-webhooks
 */
async function main(): Promise<void> {
  console.error(
    'PI-SPI is not operational in apps/api yet. Run webhook registration from the pi-spi-sdk repository when SPI credentials are configured.',
  );
  process.exit(1);
}

main().catch((error) => {
  console.error('Failed to register PI-SPI webhooks:', error);
  process.exit(1);
});
