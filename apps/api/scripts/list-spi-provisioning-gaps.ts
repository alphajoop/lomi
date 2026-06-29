#!/usr/bin/env npx ts-node
/**
 * Lists organizations with SPI connected but missing provisioned account numbers.
 * Calls apps/api internal endpoint or Supabase RPC directly.
 *
 * Usage:
 *   INTERNAL_API_KEY=... API_URL=https://api.lomi.africa pnpm exec ts-node scripts/list-spi-provisioning-gaps.ts
 */

const apiUrl = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const internalKey = process.env.INTERNAL_API_KEY?.trim();

async function main() {
  if (!internalKey) {
    console.error('INTERNAL_API_KEY is required');
    process.exit(1);
  }

  const response = await fetch(`${apiUrl}/internal/spi/list-orgs-missing-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Api-Key': internalKey,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    console.error('Request failed:', body);
    process.exit(1);
  }

  const rows = Array.isArray(body) ? body : [];
  if (rows.length === 0) {
    console.log('All SPI-connected orgs have provisioned account numbers.');
    return;
  }

  console.log(`Orgs missing SPI account (${rows.length}):`);
  for (const row of rows) {
    console.log(
      `- ${row.organization_name ?? row.organization_id} (${row.organization_id}) [${row.currency_code}]`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
